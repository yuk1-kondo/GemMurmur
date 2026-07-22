import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const promoDir = resolve(scriptDir, '..')
const assets = resolve(promoDir, 'assets')
const narration = resolve(promoDir, 'narration')
const subtitles = resolve(promoDir, 'subtitles')
const output = resolve(promoDir, 'output')
const work = resolve(output, '.work')
const ffmpeg = '/opt/homebrew/bin/ffmpeg'
const ffprobe = '/opt/homebrew/bin/ffprobe'
const espeak = '/opt/homebrew/bin/espeak-ng'
const convert = '/opt/homebrew/bin/convert'
const font = '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'

mkdirSync(output, { recursive: true })
mkdirSync(work, { recursive: true })

function run(bin, args, options = {}) {
  execFileSync(bin, args, { stdio: 'inherit', ...options })
}

function asset(name) {
  return resolve(assets, name)
}

function textLayer(name, text, { color = '#111111', size = 48, outline = '#111111' } = {}) {
  const dest = resolve(work, `${name}.png`)
  run(convert, [
    '-background', 'none',
    '-fill', color,
    '-stroke', outline,
    '-strokewidth', '2',
    '-font', font,
    '-pointsize', String(size),
    `label:${text}`,
    dest,
  ])
  return dest
}

function titleLayer(name, text, size) {
  const dest = resolve(work, `${name}.png`)
  run(convert, [
    '-background', '#ffffffe6',
    '-fill', '#111111',
    '-stroke', 'none',
    '-bordercolor', 'none',
    '-border', '24',
    '-font', font,
    '-pointsize', String(size),
    `label:${text}`,
    dest,
  ])
  return dest
}

function addLoopInput(args, path) {
  args.push('-loop', '1', '-i', path)
}

function overlayChain({ baseFilter, layers }) {
  const filter = [`[0:v]${baseFilter}[v0]`]
  let previous = 'v0'
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index]
    const outputName = `v${index + 1}`
    const x = layer.reverse
      ? `-overlay_w+mod(t*${layer.speed}+${layer.offset},main_w+overlay_w)`
      : `main_w-mod(t*${layer.speed}+${layer.offset},main_w+overlay_w)`
    const positionX = layer.static ? '(main_w-overlay_w)/2' : x
    filter.push(
      `[${previous}][${index + 1}:v]overlay=x='${positionX}':y=${layer.y}:format=auto:enable='between(t,${layer.start ?? 0},${layer.end})'[${outputName}]`,
    )
    previous = outputName
  }
  return { filter: filter.join(';'), out: previous }
}

const normalComments = [
  ['それな', 185, '#10A37F', 210, 0, false, 46],
  ['nice', 330, '#5B8CFF', 185, 460, false, 40],
  ['わかる', 505, '#F472B6', 235, 920, false, 44],
  ['gg', 650, '#F5C451', 170, 270, true, 42],
]

const buzzComments = [
  ['草', 190, '#10A37F', 460, 0, false, 64],
  ['W', 250, '#FF5A5F', 380, 480, false, 72],
  ['ㅋㅋㅋ', 310, '#A78BFA', 440, 880, false, 56],
  ['yyds', 370, '#FB923C', 410, 220, true, 54],
  ['mdr', 430, '#5B8CFF', 470, 720, false, 58],
  ['最高', 490, '#F5C451', 390, 140, false, 64],
  ['brabo', 550, '#F472B6', 450, 590, false, 50],
  ['대박', 610, '#10A37F', 430, 340, true, 60],
  ['legend', 670, '#FF5A5F', 400, 900, false, 54],
  ['すごい', 730, '#A78BFA', 470, 180, false, 64],
  ['555', 790, '#F5C451', 380, 670, false, 58],
  ['vamos', 850, '#FB923C', 450, 310, true, 54],
  ['神', 910, '#5B8CFF', 490, 810, false, 70],
  ['🔥', 970, '#F472B6', 370, 510, false, 58],
]

function commentLayers(prefix, comments, seconds, scale = 1, yOffset = 0) {
  return comments.map(([text, y, color, speed, offset, reverse, size], index) => ({
    path: textLayer(`${prefix}-comment-${index}`, text, { color, size: Math.round(size * scale) }),
    y: Math.round(y * scale) + yOffset,
    speed: Math.round(speed * scale),
    offset,
    reverse,
    end: seconds,
  }))
}

function makeScreenScene({ name, image, seconds, heading, comments = [], dim = false }) {
  const title = titleLayer(`${name}-title`, heading, 54)
  const layers = [
    { path: title, y: 72, static: true, end: seconds },
    ...commentLayers(name, comments, seconds),
  ]
  const args = ['-y']
  addLoopInput(args, image)
  for (const layer of layers) addLoopInput(args, layer.path)
  const brightness = dim ? ',eq=brightness=-0.07' : ''
  const { filter, out } = overlayChain({
    baseFilter: `scale=1920:1200,crop=1920:1080:0:60${brightness},format=rgba`,
    layers,
  })
  const dest = resolve(work, `${name}.mp4`)
  args.push('-t', String(seconds), '-r', '30', '-filter_complex', filter, '-map', `[${out}]`, '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', dest)
  run(ffmpeg, args)
  return dest
}

function makeEndScene({ name, seconds, language, width = 1920, height = 1080 }) {
  const heading = language === 'ja' ? 'すべてのページに、観客を。' : 'Every page has an audience.'
  const title = textLayer(`${name}-brand`, 'GemMurmur', { color: '#111111', size: Math.round(width * 0.07), outline: 'none' })
  const line = textLayer(`${name}-heading`, heading, { color: '#111111', size: Math.round(width * 0.032), outline: 'none' })
  const sub = textLayer(`${name}-sub`, 'Local Gemma  •  Multilingual', { color: '#205544', size: Math.round(width * 0.018), outline: 'none' })
  const layers = [
    { path: title, y: Math.round(height * 0.34), static: true, end: seconds },
    { path: line, y: Math.round(height * 0.47), static: true, end: seconds },
    { path: sub, y: Math.round(height * 0.59), static: true, end: seconds },
  ]
  const args = ['-y']
  addLoopInput(args, asset('gemmurmur-endcard-background.png'))
  for (const layer of layers) addLoopInput(args, layer.path)
  const { filter, out } = overlayChain({
    baseFilter: `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=rgba`,
    layers,
  })
  const dest = resolve(work, `${name}.mp4`)
  args.push('-t', String(seconds), '-r', '30', '-filter_complex', filter, '-map', `[${out}]`, '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', dest)
  run(ffmpeg, args)
  return dest
}

function makeVerticalScene({ name, image, seconds, heading, comments = [] }) {
  const title = titleLayer(`${name}-title`, heading, 42)
  const layers = [
    { path: title, y: 145, static: true, end: seconds },
    ...commentLayers(name, comments, seconds, comments.length > 6 ? 1.45 : 1.1, comments.length > 6 ? 120 : 245),
  ]
  const args = ['-y']
  addLoopInput(args, asset('gemmurmur-endcard-background.png'))
  addLoopInput(args, image)
  for (const layer of layers) addLoopInput(args, layer.path)
  const filterParts = [
    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=rgba[bg]',
    '[1:v]scale=1000:625[screen]',
    '[bg][screen]overlay=x=40:y=560:format=auto[v0]',
  ]
  let previous = 'v0'
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index]
    const outputName = `v${index + 1}`
    const x = layer.reverse
      ? `-overlay_w+mod(t*${layer.speed}+${layer.offset},main_w+overlay_w)`
      : `main_w-mod(t*${layer.speed}+${layer.offset},main_w+overlay_w)`
    const positionX = layer.static ? '(main_w-overlay_w)/2' : x
    filterParts.push(
      `[${previous}][${index + 2}:v]overlay=x='${positionX}':y=${layer.y}:format=auto:enable='between(t,${layer.start ?? 0},${layer.end})'[${outputName}]`,
    )
    previous = outputName
  }
  const dest = resolve(work, `${name}.mp4`)
  args.push('-t', String(seconds), '-r', '30', '-filter_complex', filterParts.join(';'), '-map', `[${previous}]`, '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', dest)
  run(ffmpeg, args)
  return dest
}

function concat(name, clips) {
  const dest = resolve(work, `${name}.mp4`)
  const args = ['-y']
  for (const clip of clips) args.push('-i', clip)
  const inputs = clips.map((_, index) => `[${index}:v]`).join('')
  args.push('-filter_complex', `${inputs}concat=n=${clips.length}:v=1:a=0[v]`, '-map', '[v]', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', dest)
  run(ffmpeg, args)
  return dest
}

const voiceCues = {
  'ja-30s': [
    ['すべてのページに、観客を。', 3.2],
    ['ジェムマーマー。ページにコメントを流す、クローム拡張です。', 4],
    ['いつものブラウジングに、軽やかな反応を。', 3.1],
    ['バズモード。カラーコメントが、全画面に。', 6.5],
    ['ローカルジェマ。多言語対応。ページの内容は端末の中に。', 7.2],
    ['ジェムマーマー。エブリ・ページ・ハズ・アン・オーディエンス。', 6],
  ],
  'en-30s': [
    ['Every page deserves an audience.', 3.2],
    ['GemMurmur streams live comments directly over the web.', 4],
    ['In normal mode, reactions glide right to left.', 3.1],
    ['Buzz mode turns the whole screen into a colourful crowd.', 6.5],
    ['Local Gemma. Multilingual comments. Every voice can join.', 7.2],
    ['GemMurmur. Every page has an audience.', 6],
  ],
  'ja-15s': [
    ['どんなページにも、観客を。', 3],
    ['コメントが、右から左へ流れます。', 3],
    ['バズモード。カラーコメントが全画面に。', 4],
    ['ローカルジェマ。多言語対応。', 2.6],
    ['ジェムマーマー。', 2.4],
  ],
  'en-15s': [
    ['Every page deserves an audience.', 3],
    ['Comments flow right to left.', 3],
    ['Buzz mode fills the screen with colour.', 4],
    ['Local Gemma. Many languages.', 2.6],
    ['GemMurmur.', 2.4],
  ],
}

function audioDuration(path) {
  return Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1', path], { encoding: 'utf8' }).trim().replace('duration=', ''))
}

function makeVoice(language, duration) {
  const key = `${language}-${duration}`
  const cues = voiceCues[key]
  const voice = language === 'ja' ? 'ja' : 'en-us'
  const rate = language === 'ja' ? '300' : '175'
  const clips = []

  for (const [text, slot] of cues) {
    const index = clips.length
    const raw = resolve(work, `${key}-voice-${index}-raw.wav`)
    const padded = resolve(work, `${key}-voice-${index}.wav`)
    run(espeak, ['-v', voice, '-s', rate, '-a', '175', '-w', raw, text])
    const spoken = audioDuration(raw)
    const speechWindow = Math.max(0.45, slot * 0.86)
    const tempo = Math.max(0.5, Math.min(2.0, spoken / speechWindow))
    run(ffmpeg, ['-y', '-i', raw, '-af', `atempo=${tempo.toFixed(3)},apad=pad_dur=${slot}`, '-t', String(slot), '-ar', '48000', '-ac', '1', padded])
    clips.push(padded)
  }

  const inputs = clips.flatMap((clip) => ['-i', clip])
  const labels = clips.map((_, index) => `[${index}:a]`).join('')
  const wav = resolve(work, `${key}.wav`)
  const m4a = resolve(work, `${key}.m4a`)
  run(ffmpeg, ['-y', ...inputs, '-filter_complex', `${labels}concat=n=${clips.length}:v=0:a=1[a]`, '-map', '[a]', '-ar', '48000', '-ac', '1', wav])
  run(ffmpeg, ['-y', '-i', wav, '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', m4a])
  return m4a
}

function muxVideo({ visual, voice, subtitle, destination, seconds, language }) {
  const subtitleInput = voice ? '2:0' : '1:0'
  const args = ['-y', '-i', visual]
  if (voice) args.push('-i', voice)
  args.push('-i', subtitle)
  if (voice) args.push('-filter_complex', `[1:a]apad=pad_dur=${seconds}[a]`, '-map', '0:v', '-map', '[a]')
  else args.push('-map', '0:v')
  args.push(
    '-map', subtitleInput,
    '-t', String(seconds),
    '-c:v', 'libx264', '-crf', '18', '-c:s', 'mov_text',
    '-metadata:s:s:0', `language=${language}`,
    '-movflags', '+faststart', destination,
  )
  if (voice) args.push('-c:a', 'aac', '-b:a', '192k')
  run(ffmpeg, args)
}

function build30(language) {
  const normal = makeScreenScene({
    name: `normal-${language}`,
    image: asset('actual-overlay.png'),
    seconds: 10.3,
    heading: language === 'ja' ? 'ページに、観客を。' : 'Every page deserves an audience.',
    comments: normalComments,
  })
  const buzz = makeScreenScene({
    name: `buzz-${language}`,
    image: asset('actual-overlay.png'),
    seconds: 6.5,
    heading: 'BUZZ MODE',
    comments: buzzComments,
    dim: true,
  })
  const local = makeScreenScene({
    name: `local-${language}`,
    image: asset('actual-popup-ready.png'),
    seconds: 7.2,
    heading: language === 'ja' ? 'ローカルGemma  •  多言語対応' : 'Local Gemma  •  Multilingual',
    comments: normalComments.slice(0, 2),
  })
  const end = makeEndScene({ name: `end-${language}`, seconds: 6, language })
  const visual = concat(`gemmurmur-30s-${language}-visual`, [normal, buzz, local, end])
  muxVideo({
    visual,
    voice: makeVoice(language, '30s'),
    subtitle: resolve(subtitles, `${language}-30s.srt`),
    destination: resolve(output, `gemmurmur-30s-${language}.mp4`),
    seconds: 30,
    language,
  })
}

function build15(language) {
  const normal = makeVerticalScene({
    name: `vertical-normal-${language}`,
    image: asset('actual-overlay.png'),
    seconds: 6,
    heading: 'GemMurmur',
    comments: normalComments,
  })
  const buzz = makeVerticalScene({
    name: `vertical-buzz-${language}`,
    image: asset('actual-overlay.png'),
    seconds: 5,
    heading: 'BUZZ MODE',
    comments: buzzComments,
  })
  const end = makeEndScene({ name: `vertical-end-${language}`, seconds: 4, language, width: 1080, height: 1920 })
  const visual = concat(`gemmurmur-15s-vertical-${language}-visual`, [normal, buzz, end])
  muxVideo({
    visual,
    voice: makeVoice(language, '15s'),
    subtitle: resolve(subtitles, `${language}-15s.srt`),
    destination: resolve(output, `gemmurmur-15s-vertical-${language}.mp4`),
    seconds: 15,
    language,
  })
}

for (const required of [asset('actual-overlay.png'), asset('actual-popup-ready.png'), asset('gemmurmur-endcard-background.png')]) {
  if (!existsSync(required)) throw new Error(`Missing asset: ${required}`)
}

for (const language of ['ja', 'en']) {
  build30(language)
  build15(language)
}

console.log(`Created GemMurmur promo videos in ${output}`)

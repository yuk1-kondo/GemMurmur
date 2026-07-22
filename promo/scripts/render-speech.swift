import AVFoundation
import Foundation

guard CommandLine.arguments.count == 4 else {
    fputs("Usage: render-speech.swift <ja-JP|en-US> <input.txt> <output.caf>\n", stderr)
    exit(64)
}

let language = CommandLine.arguments[1]
let inputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
let text = try String(contentsOf: inputURL, encoding: .utf8)
let synthesizer = AVSpeechSynthesizer()
let utterance = AVSpeechUtterance(string: text)
utterance.voice = AVSpeechSynthesisVoice(language: language)
utterance.rate = language == "ja-JP" ? 0.52 : 0.47

var audioFile: AVAudioFile?
var writeError: Error?
var finished = false

synthesizer.write(utterance) { buffer in
    guard let pcmBuffer = buffer as? AVAudioPCMBuffer else { return }
    if pcmBuffer.frameLength == 0 {
        finished = true
        return
    }

    do {
        if audioFile == nil {
            audioFile = try AVAudioFile(
                forWriting: outputURL,
                settings: pcmBuffer.format.settings,
                commonFormat: .pcmFormatFloat32,
                interleaved: false
            )
        }
        try audioFile?.write(from: pcmBuffer)
    } catch {
        writeError = error
        finished = true
    }
}

while !finished && writeError == nil {
    RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.02))
}
if let writeError {
    throw writeError
}
if audioFile == nil {
    throw NSError(domain: "GemMurmurSpeech", code: 1, userInfo: [NSLocalizedDescriptionKey: "The system speech engine did not return audio buffers."])
}

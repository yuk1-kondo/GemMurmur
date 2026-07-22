import { LANGUAGE_NAMES, languageFromTag } from './language'
import type { ResolvedLanguage } from './types'

type UiKey =
  | 'tagline'
  | 'version'
  | 'comments'
  | 'toggleComments'
  | 'pageActions'
  | 'pause'
  | 'resume'
  | 'stopPage'
  | 'stopSite'
  | 'resumePage'
  | 'commentLanguage'
  | 'automatic'
  | 'localModel'
  | 'modelReady'
  | 'modelPrepare'
  | 'modelPreparing'
  | 'modelSaved'
  | 'modelInitialSize'
  | 'modelSavedDetail'
  | 'modelUnsupported'
  | 'modelUnsupportedHelp'
  | 'modelFailed'
  | 'modelRetry'
  | 'modelReload'
  | 'modelDelete'
  | 'modelCancel'
  | 'privacy'
  | 'statusPageStopped'
  | 'statusSiteStopped'
  | 'statusExtensionStopped'
  | 'statusPaused'
  | 'statusReady'
  | 'statusDownloading'
  | 'statusLoading'
  | 'statusPrepare'
  | 'runtimeWebGpuUnsupported'
  | 'runtimeModelLoading'
  | 'runtimeModelPending'
  | 'runtimePrivatePage'
  | 'runtimeModelLoadFailed'
  | 'runtimeMemoryError'

type UiCopy = Record<UiKey, string>

const EN: UiCopy = {
  tagline: 'Every page has an audience.', version: 'Version', comments: 'Comments', toggleComments: 'Turn comments on or off', pageActions: 'Page controls', pause: 'Pause', resume: 'Resume', stopPage: 'Stop on this page', stopSite: 'Stop on this site', resumePage: 'Resume on this page', commentLanguage: 'Comment language', automatic: 'Automatic', localModel: 'Local model', modelReady: 'Ready', modelPrepare: 'Prepare the model', modelPreparing: 'Preparing the model', modelSaved: 'Saved on this device', modelInitialSize: 'The first download saves about 2.0 GB on this device.', modelSavedDetail: 'Saving on this device. Page content never leaves your device.', modelUnsupported: 'WebGPU is unavailable', modelUnsupportedHelp: 'Open in a compatible browser and try again.', modelFailed: 'Could not prepare the model', modelRetry: 'Try again', modelReload: 'Reload', modelDelete: 'Delete', modelCancel: 'Cancel download', privacy: 'Runs locally with Gemma. Page content stays on your device.', statusPageStopped: 'Stopped on this page', statusSiteStopped: 'Stopped on this site', statusExtensionStopped: 'GemMurmur is stopped', statusPaused: 'Paused', statusReady: 'Ready', statusDownloading: 'Downloading {percent}%', statusLoading: 'Loading', statusPrepare: 'Prepare the model', runtimeWebGpuUnsupported: 'WebGPU is unavailable.\nOpen this page in a compatible browser.', runtimeModelLoading: 'Loading model…', runtimeModelPending: 'Preparing Gemma…\nLoad the model from the extension popup.', runtimePrivatePage: 'GemMurmur is unavailable on private pages.', runtimeModelLoadFailed: 'Could not load the model.\nPlease try again.', runtimeMemoryError: 'Not enough memory.\nClose other tabs or apps and try again.',
}

const JA: UiCopy = {
  tagline: 'すべてのページに、観客を。', version: 'バージョン', comments: 'コメント', toggleComments: 'コメントをオンまたはオフにする', pageActions: 'このページでの操作', pause: '一時停止', resume: '再開', stopPage: 'このページでは停止', stopSite: 'このサイトでは停止', resumePage: 'このページで再開', commentLanguage: 'コメント言語', automatic: '自動', localModel: 'ローカルモデル', modelReady: '準備できました', modelPrepare: 'モデルを準備する', modelPreparing: 'モデルを準備しています', modelSaved: '端末内に保存済み', modelInitialSize: '初回は約 2.0 GB を端末内に保存します。', modelSavedDetail: '端末内に保存中です。ページ内容は外部送信しません。', modelUnsupported: 'WebGPU を利用できません', modelUnsupportedHelp: '対応ブラウザで開いて、もう一度試してください。', modelFailed: 'モデルの準備に失敗しました', modelRetry: 'もう一度試す', modelReload: '再読み込み', modelDelete: '削除', modelCancel: 'ダウンロードを取り消す', privacy: 'Gemma は端末内で動作します。ページ内容は端末から送信されません。', statusPageStopped: 'このページでは停止中', statusSiteStopped: 'このサイトでは停止中', statusExtensionStopped: 'GemMurmur は停止中', statusPaused: '一時停止中', statusReady: '準備完了', statusDownloading: 'ダウンロード中 {percent}%', statusLoading: '読み込み中', statusPrepare: 'モデルを準備してください', runtimeWebGpuUnsupported: 'WebGPU を利用できません。\n対応ブラウザで開いてください。', runtimeModelLoading: 'モデル読み込み中…', runtimeModelPending: 'Gemma準備中…\nポップアップからモデルを読み込んでください', runtimePrivatePage: 'ここでは静かにしておきます。', runtimeModelLoadFailed: 'モデルの読み込みに失敗しました。\nもう一度試してください。', runtimeMemoryError: 'メモリが不足しています。\nほかのタブやアプリを閉じてください。',
}

const ZH_HANS: UiCopy = {
  tagline: '每个页面都有观众。', version: '版本', comments: '评论', toggleComments: '开启或关闭评论', pageActions: '页面控制', pause: '暂停', resume: '继续', stopPage: '在此页面停止', stopSite: '在此网站停止', resumePage: '在此页面继续', commentLanguage: '评论语言', automatic: '自动', localModel: '本地模型', modelReady: '已准备就绪', modelPrepare: '准备模型', modelPreparing: '正在准备模型', modelSaved: '已保存在此设备上', modelInitialSize: '首次下载将在此设备保存约 2.0 GB。', modelSavedDetail: '正在保存到此设备。页面内容不会离开你的设备。', modelUnsupported: '无法使用 WebGPU', modelUnsupportedHelp: '请在兼容的浏览器中打开后重试。', modelFailed: '无法准备模型', modelRetry: '重试', modelReload: '重新加载', modelDelete: '删除', modelCancel: '取消下载', privacy: 'Gemma 在本地运行。页面内容保留在你的设备上。', statusPageStopped: '已在此页面停止', statusSiteStopped: '已在此网站停止', statusExtensionStopped: 'GemMurmur 已停止', statusPaused: '已暂停', statusReady: '已就绪', statusDownloading: '下载中 {percent}%', statusLoading: '加载中', statusPrepare: '请准备模型', runtimeWebGpuUnsupported: '无法使用 WebGPU。\n请使用兼容的浏览器打开此页面。', runtimeModelLoading: '正在加载模型…', runtimeModelPending: '正在准备 Gemma…\n请从扩展弹窗加载模型。', runtimePrivatePage: 'GemMurmur 无法在私密页面中使用。', runtimeModelLoadFailed: '无法加载模型。\n请重试。', runtimeMemoryError: '内存不足。\n请关闭其他标签页或应用后重试。',
}

const ZH_HANT: UiCopy = {
  tagline: '每個頁面都有觀眾。', version: '版本', comments: '留言', toggleComments: '開啟或關閉留言', pageActions: '頁面控制', pause: '暫停', resume: '繼續', stopPage: '在此頁面停止', stopSite: '在此網站停止', resumePage: '在此頁面繼續', commentLanguage: '留言語言', automatic: '自動', localModel: '本機模型', modelReady: '已準備就緒', modelPrepare: '準備模型', modelPreparing: '正在準備模型', modelSaved: '已儲存在此裝置', modelInitialSize: '首次下載會在此裝置儲存約 2.0 GB。', modelSavedDetail: '正在儲存到此裝置。頁面內容不會離開你的裝置。', modelUnsupported: '無法使用 WebGPU', modelUnsupportedHelp: '請在相容的瀏覽器中開啟後再試一次。', modelFailed: '無法準備模型', modelRetry: '再試一次', modelReload: '重新載入', modelDelete: '刪除', modelCancel: '取消下載', privacy: 'Gemma 在本機執行。頁面內容會保留在你的裝置上。', statusPageStopped: '已在此頁面停止', statusSiteStopped: '已在此網站停止', statusExtensionStopped: 'GemMurmur 已停止', statusPaused: '已暫停', statusReady: '已就緒', statusDownloading: '下載中 {percent}%', statusLoading: '載入中', statusPrepare: '請準備模型', runtimeWebGpuUnsupported: '無法使用 WebGPU。\n請使用相容的瀏覽器開啟此頁面。', runtimeModelLoading: '正在載入模型…', runtimeModelPending: '正在準備 Gemma…\n請從擴充功能彈窗載入模型。', runtimePrivatePage: 'GemMurmur 無法在私密頁面中使用。', runtimeModelLoadFailed: '無法載入模型。\n請再試一次。', runtimeMemoryError: '記憶體不足。\n請關閉其他分頁或 App 後再試一次。',
}

const ES: UiCopy = {
  tagline: 'Cada página tiene público.', version: 'Versión', comments: 'Comentarios', toggleComments: 'Activar o desactivar comentarios', pageActions: 'Controles de página', pause: 'Pausar', resume: 'Reanudar', stopPage: 'Detener en esta página', stopSite: 'Detener en este sitio', resumePage: 'Reanudar en esta página', commentLanguage: 'Idioma de comentarios', automatic: 'Automático', localModel: 'Modelo local', modelReady: 'Listo', modelPrepare: 'Preparar el modelo', modelPreparing: 'Preparando el modelo', modelSaved: 'Guardado en este dispositivo', modelInitialSize: 'La primera descarga guarda unos 2.0 GB en este dispositivo.', modelSavedDetail: 'Guardando en este dispositivo. El contenido de la página no sale de él.', modelUnsupported: 'WebGPU no está disponible', modelUnsupportedHelp: 'Ábrelo en un navegador compatible e inténtalo de nuevo.', modelFailed: 'No se pudo preparar el modelo', modelRetry: 'Intentar de nuevo', modelReload: 'Recargar', modelDelete: 'Eliminar', modelCancel: 'Cancelar descarga', privacy: 'Gemma se ejecuta localmente. El contenido de la página se queda en tu dispositivo.', statusPageStopped: 'Detenido en esta página', statusSiteStopped: 'Detenido en este sitio', statusExtensionStopped: 'GemMurmur está detenido', statusPaused: 'En pausa', statusReady: 'Listo', statusDownloading: 'Descargando {percent}%', statusLoading: 'Cargando', statusPrepare: 'Prepara el modelo', runtimeWebGpuUnsupported: 'WebGPU no está disponible.\nAbre esta página en un navegador compatible.', runtimeModelLoading: 'Cargando el modelo…', runtimeModelPending: 'Preparando Gemma…\nCarga el modelo desde la ventana de la extensión.', runtimePrivatePage: 'GemMurmur no está disponible en páginas privadas.', runtimeModelLoadFailed: 'No se pudo cargar el modelo.\nInténtalo de nuevo.', runtimeMemoryError: 'No hay suficiente memoria.\nCierra otras pestañas o aplicaciones e inténtalo de nuevo.',
}

const FR: UiCopy = {
  tagline: 'Chaque page a son public.', version: 'Version', comments: 'Commentaires', toggleComments: 'Activer ou désactiver les commentaires', pageActions: 'Commandes de la page', pause: 'Suspendre', resume: 'Reprendre', stopPage: 'Arrêter sur cette page', stopSite: 'Arrêter sur ce site', resumePage: 'Reprendre sur cette page', commentLanguage: 'Langue des commentaires', automatic: 'Automatique', localModel: 'Modèle local', modelReady: 'Prêt', modelPrepare: 'Préparer le modèle', modelPreparing: 'Préparation du modèle', modelSaved: 'Enregistré sur cet appareil', modelInitialSize: 'Le premier téléchargement enregistre environ 2,0 Go sur cet appareil.', modelSavedDetail: 'Enregistrement sur cet appareil. Le contenu de la page ne le quitte jamais.', modelUnsupported: 'WebGPU est indisponible', modelUnsupportedHelp: 'Ouvrez dans un navigateur compatible et réessayez.', modelFailed: 'Impossible de préparer le modèle', modelRetry: 'Réessayer', modelReload: 'Recharger', modelDelete: 'Supprimer', modelCancel: 'Annuler le téléchargement', privacy: 'Gemma s’exécute localement. Le contenu de la page reste sur votre appareil.', statusPageStopped: 'Arrêté sur cette page', statusSiteStopped: 'Arrêté sur ce site', statusExtensionStopped: 'GemMurmur est arrêté', statusPaused: 'En pause', statusReady: 'Prêt', statusDownloading: 'Téléchargement {percent}%', statusLoading: 'Chargement', statusPrepare: 'Préparez le modèle', runtimeWebGpuUnsupported: 'WebGPU est indisponible.\nOuvrez cette page dans un navigateur compatible.', runtimeModelLoading: 'Chargement du modèle…', runtimeModelPending: 'Préparation de Gemma…\nChargez le modèle depuis la fenêtre de l’extension.', runtimePrivatePage: 'GemMurmur est indisponible sur les pages privées.', runtimeModelLoadFailed: 'Impossible de charger le modèle.\nRéessayez.', runtimeMemoryError: 'Mémoire insuffisante.\nFermez d’autres onglets ou applications et réessayez.',
}

const DE: UiCopy = {
  tagline: 'Jede Seite hat ein Publikum.', version: 'Version', comments: 'Kommentare', toggleComments: 'Kommentare ein- oder ausschalten', pageActions: 'Seitensteuerung', pause: 'Pausieren', resume: 'Fortsetzen', stopPage: 'Auf dieser Seite stoppen', stopSite: 'Auf dieser Website stoppen', resumePage: 'Auf dieser Seite fortsetzen', commentLanguage: 'Kommentarsprache', automatic: 'Automatisch', localModel: 'Lokales Modell', modelReady: 'Bereit', modelPrepare: 'Modell vorbereiten', modelPreparing: 'Modell wird vorbereitet', modelSaved: 'Auf diesem Gerät gespeichert', modelInitialSize: 'Der erste Download speichert etwa 2,0 GB auf diesem Gerät.', modelSavedDetail: 'Wird auf diesem Gerät gespeichert. Seiteninhalte verlassen das Gerät nicht.', modelUnsupported: 'WebGPU ist nicht verfügbar', modelUnsupportedHelp: 'In einem kompatiblen Browser öffnen und erneut versuchen.', modelFailed: 'Modell konnte nicht vorbereitet werden', modelRetry: 'Erneut versuchen', modelReload: 'Neu laden', modelDelete: 'Löschen', modelCancel: 'Download abbrechen', privacy: 'Gemma läuft lokal. Seiteninhalte bleiben auf deinem Gerät.', statusPageStopped: 'Auf dieser Seite gestoppt', statusSiteStopped: 'Auf dieser Website gestoppt', statusExtensionStopped: 'GemMurmur ist gestoppt', statusPaused: 'Pausiert', statusReady: 'Bereit', statusDownloading: 'Wird heruntergeladen {percent}%', statusLoading: 'Wird geladen', statusPrepare: 'Modell vorbereiten', runtimeWebGpuUnsupported: 'WebGPU ist nicht verfügbar.\nÖffne diese Seite in einem kompatiblen Browser.', runtimeModelLoading: 'Modell wird geladen…', runtimeModelPending: 'Gemma wird vorbereitet…\nLade das Modell über das Erweiterungsfenster.', runtimePrivatePage: 'GemMurmur ist auf privaten Seiten nicht verfügbar.', runtimeModelLoadFailed: 'Modell konnte nicht geladen werden.\nBitte erneut versuchen.', runtimeMemoryError: 'Nicht genügend Speicher.\nSchließe andere Tabs oder Apps und versuche es erneut.',
}

const PT_BR: UiCopy = {
  tagline: 'Toda página tem uma audiência.', version: 'Versão', comments: 'Comentários', toggleComments: 'Ativar ou desativar comentários', pageActions: 'Controles da página', pause: 'Pausar', resume: 'Retomar', stopPage: 'Parar nesta página', stopSite: 'Parar neste site', resumePage: 'Retomar nesta página', commentLanguage: 'Idioma dos comentários', automatic: 'Automático', localModel: 'Modelo local', modelReady: 'Pronto', modelPrepare: 'Preparar o modelo', modelPreparing: 'Preparando o modelo', modelSaved: 'Salvo neste dispositivo', modelInitialSize: 'O primeiro download salva cerca de 2,0 GB neste dispositivo.', modelSavedDetail: 'Salvando neste dispositivo. O conteúdo da página não sai dele.', modelUnsupported: 'WebGPU não está disponível', modelUnsupportedHelp: 'Abra em um navegador compatível e tente novamente.', modelFailed: 'Não foi possível preparar o modelo', modelRetry: 'Tentar novamente', modelReload: 'Recarregar', modelDelete: 'Excluir', modelCancel: 'Cancelar download', privacy: 'Gemma funciona localmente. O conteúdo da página fica no seu dispositivo.', statusPageStopped: 'Parado nesta página', statusSiteStopped: 'Parado neste site', statusExtensionStopped: 'GemMurmur está parado', statusPaused: 'Pausado', statusReady: 'Pronto', statusDownloading: 'Baixando {percent}%', statusLoading: 'Carregando', statusPrepare: 'Prepare o modelo', runtimeWebGpuUnsupported: 'WebGPU não está disponível.\nAbra esta página em um navegador compatível.', runtimeModelLoading: 'Carregando o modelo…', runtimeModelPending: 'Preparando o Gemma…\nCarregue o modelo pela janela da extensão.', runtimePrivatePage: 'GemMurmur não está disponível em páginas privadas.', runtimeModelLoadFailed: 'Não foi possível carregar o modelo.\nTente novamente.', runtimeMemoryError: 'Memória insuficiente.\nFeche outras abas ou aplicativos e tente novamente.',
}

const IT: UiCopy = {
  tagline: 'Ogni pagina ha un pubblico.', version: 'Versione', comments: 'Commenti', toggleComments: 'Attiva o disattiva i commenti', pageActions: 'Controlli della pagina', pause: 'Metti in pausa', resume: 'Riprendi', stopPage: 'Ferma in questa pagina', stopSite: 'Ferma in questo sito', resumePage: 'Riprendi in questa pagina', commentLanguage: 'Lingua dei commenti', automatic: 'Automatico', localModel: 'Modello locale', modelReady: 'Pronto', modelPrepare: 'Prepara il modello', modelPreparing: 'Preparazione del modello', modelSaved: 'Salvato su questo dispositivo', modelInitialSize: 'Il primo download salva circa 2,0 GB su questo dispositivo.', modelSavedDetail: 'Salvataggio su questo dispositivo. Il contenuto della pagina non lascia il dispositivo.', modelUnsupported: 'WebGPU non è disponibile', modelUnsupportedHelp: 'Apri in un browser compatibile e riprova.', modelFailed: 'Impossibile preparare il modello', modelRetry: 'Riprova', modelReload: 'Ricarica', modelDelete: 'Elimina', modelCancel: 'Annulla download', privacy: 'Gemma funziona localmente. Il contenuto della pagina resta sul tuo dispositivo.', statusPageStopped: 'Fermato in questa pagina', statusSiteStopped: 'Fermato in questo sito', statusExtensionStopped: 'GemMurmur è fermo', statusPaused: 'In pausa', statusReady: 'Pronto', statusDownloading: 'Download {percent}%', statusLoading: 'Caricamento', statusPrepare: 'Prepara il modello', runtimeWebGpuUnsupported: 'WebGPU non è disponibile.\nApri questa pagina in un browser compatibile.', runtimeModelLoading: 'Caricamento del modello…', runtimeModelPending: 'Preparazione di Gemma…\nCarica il modello dalla finestra dell’estensione.', runtimePrivatePage: 'GemMurmur non è disponibile nelle pagine private.', runtimeModelLoadFailed: 'Impossibile caricare il modello.\nRiprova.', runtimeMemoryError: 'Memoria insufficiente.\nChiudi altre schede o app e riprova.',
}

const KO: UiCopy = {
  tagline: '모든 페이지에는 관객이 있습니다.', version: '버전', comments: '댓글', toggleComments: '댓글 켜기 또는 끄기', pageActions: '페이지 제어', pause: '일시정지', resume: '계속', stopPage: '이 페이지에서 중지', stopSite: '이 사이트에서 중지', resumePage: '이 페이지에서 계속', commentLanguage: '댓글 언어', automatic: '자동', localModel: '로컬 모델', modelReady: '준비 완료', modelPrepare: '모델 준비', modelPreparing: '모델 준비 중', modelSaved: '이 기기에 저장됨', modelInitialSize: '첫 다운로드 시 이 기기에 약 2.0GB가 저장됩니다.', modelSavedDetail: '이 기기에 저장 중입니다. 페이지 콘텐츠는 기기를 벗어나지 않습니다.', modelUnsupported: 'WebGPU를 사용할 수 없습니다', modelUnsupportedHelp: '호환되는 브라우저에서 열고 다시 시도하세요.', modelFailed: '모델을 준비할 수 없습니다', modelRetry: '다시 시도', modelReload: '새로고침', modelDelete: '삭제', modelCancel: '다운로드 취소', privacy: 'Gemma는 기기에서 실행됩니다. 페이지 콘텐츠는 기기에 남아 있습니다.', statusPageStopped: '이 페이지에서 중지됨', statusSiteStopped: '이 사이트에서 중지됨', statusExtensionStopped: 'GemMurmur가 중지됨', statusPaused: '일시정지됨', statusReady: '준비 완료', statusDownloading: '다운로드 중 {percent}%', statusLoading: '로딩 중', statusPrepare: '모델을 준비하세요', runtimeWebGpuUnsupported: 'WebGPU를 사용할 수 없습니다.\n호환되는 브라우저에서 이 페이지를 여세요.', runtimeModelLoading: '모델 로딩 중…', runtimeModelPending: 'Gemma 준비 중…\n확장 프로그램 팝업에서 모델을 불러오세요.', runtimePrivatePage: '비공개 페이지에서는 GemMurmur를 사용할 수 없습니다.', runtimeModelLoadFailed: '모델을 불러올 수 없습니다.\n다시 시도하세요.', runtimeMemoryError: '메모리가 부족합니다.\n다른 탭이나 앱을 닫고 다시 시도하세요.',
}

const RU: UiCopy = {
  tagline: 'У каждой страницы есть зрители.', version: 'Версия', comments: 'Комментарии', toggleComments: 'Включить или выключить комментарии', pageActions: 'Управление страницей', pause: 'Пауза', resume: 'Продолжить', stopPage: 'Остановить на этой странице', stopSite: 'Остановить на этом сайте', resumePage: 'Продолжить на этой странице', commentLanguage: 'Язык комментариев', automatic: 'Автоматически', localModel: 'Локальная модель', modelReady: 'Готово', modelPrepare: 'Подготовить модель', modelPreparing: 'Подготовка модели', modelSaved: 'Сохранено на устройстве', modelInitialSize: 'При первой загрузке на устройстве сохраняется около 2,0 ГБ.', modelSavedDetail: 'Сохранение на устройстве. Содержимое страницы не покидает его.', modelUnsupported: 'WebGPU недоступен', modelUnsupportedHelp: 'Откройте в совместимом браузере и повторите попытку.', modelFailed: 'Не удалось подготовить модель', modelRetry: 'Повторить', modelReload: 'Перезагрузить', modelDelete: 'Удалить', modelCancel: 'Отменить загрузку', privacy: 'Gemma работает локально. Содержимое страницы остаётся на устройстве.', statusPageStopped: 'Остановлено на этой странице', statusSiteStopped: 'Остановлено на этом сайте', statusExtensionStopped: 'GemMurmur остановлен', statusPaused: 'Приостановлено', statusReady: 'Готово', statusDownloading: 'Загрузка {percent}%', statusLoading: 'Загрузка модели', statusPrepare: 'Подготовьте модель', runtimeWebGpuUnsupported: 'WebGPU недоступен.\nОткройте эту страницу в совместимом браузере.', runtimeModelLoading: 'Загрузка модели…', runtimeModelPending: 'Подготовка Gemma…\nЗагрузите модель из окна расширения.', runtimePrivatePage: 'GemMurmur недоступен на приватных страницах.', runtimeModelLoadFailed: 'Не удалось загрузить модель.\nПовторите попытку.', runtimeMemoryError: 'Недостаточно памяти.\nЗакройте другие вкладки или приложения и повторите попытку.',
}

const AR: UiCopy = {
  tagline: 'لكل صفحة جمهور.', version: 'الإصدار', comments: 'التعليقات', toggleComments: 'تشغيل التعليقات أو إيقافها', pageActions: 'عناصر تحكم الصفحة', pause: 'إيقاف مؤقت', resume: 'استئناف', stopPage: 'إيقاف في هذه الصفحة', stopSite: 'إيقاف في هذا الموقع', resumePage: 'استئناف في هذه الصفحة', commentLanguage: 'لغة التعليقات', automatic: 'تلقائي', localModel: 'نموذج محلي', modelReady: 'جاهز', modelPrepare: 'إعداد النموذج', modelPreparing: 'جارٍ إعداد النموذج', modelSaved: 'محفوظ على هذا الجهاز', modelInitialSize: 'ينزّل الإعداد الأول نحو 2.0 غيغابايت إلى هذا الجهاز.', modelSavedDetail: 'جارٍ الحفظ على هذا الجهاز. لا يغادر محتوى الصفحة جهازك.', modelUnsupported: 'WebGPU غير متاح', modelUnsupportedHelp: 'افتحه في متصفح متوافق ثم حاول مرة أخرى.', modelFailed: 'تعذر إعداد النموذج', modelRetry: 'إعادة المحاولة', modelReload: 'إعادة التحميل', modelDelete: 'حذف', modelCancel: 'إلغاء التنزيل', privacy: 'يعمل Gemma محليًا. يبقى محتوى الصفحة على جهازك.', statusPageStopped: 'متوقف في هذه الصفحة', statusSiteStopped: 'متوقف في هذا الموقع', statusExtensionStopped: 'GemMurmur متوقف', statusPaused: 'متوقف مؤقتًا', statusReady: 'جاهز', statusDownloading: 'جارٍ التنزيل {percent}%', statusLoading: 'جارٍ التحميل', statusPrepare: 'أعد النموذج', runtimeWebGpuUnsupported: 'WebGPU غير متاح.\nافتح هذه الصفحة في متصفح متوافق.', runtimeModelLoading: 'جارٍ تحميل النموذج…', runtimeModelPending: 'جارٍ إعداد Gemma…\nحمّل النموذج من نافذة الإضافة.', runtimePrivatePage: 'GemMurmur غير متاح في الصفحات الخاصة.', runtimeModelLoadFailed: 'تعذر تحميل النموذج.\nحاول مرة أخرى.', runtimeMemoryError: 'لا توجد ذاكرة كافية.\nأغلق علامات تبويب أو تطبيقات أخرى ثم حاول مرة أخرى.',
}

const HI: UiCopy = {
  tagline: 'हर पेज के पास दर्शक हैं।', version: 'संस्करण', comments: 'टिप्पणियाँ', toggleComments: 'टिप्पणियाँ चालू या बंद करें', pageActions: 'पेज नियंत्रण', pause: 'रोकें', resume: 'फिर शुरू करें', stopPage: 'इस पेज पर रोकें', stopSite: 'इस साइट पर रोकें', resumePage: 'इस पेज पर फिर शुरू करें', commentLanguage: 'टिप्पणी भाषा', automatic: 'स्वचालित', localModel: 'स्थानीय मॉडल', modelReady: 'तैयार', modelPrepare: 'मॉडल तैयार करें', modelPreparing: 'मॉडल तैयार हो रहा है', modelSaved: 'इस डिवाइस पर सहेजा गया', modelInitialSize: 'पहला डाउनलोड इस डिवाइस पर लगभग 2.0 GB सहेजता है।', modelSavedDetail: 'इस डिवाइस पर सहेजा जा रहा है। पेज सामग्री डिवाइस से बाहर नहीं जाती।', modelUnsupported: 'WebGPU उपलब्ध नहीं है', modelUnsupportedHelp: 'इसे संगत ब्राउज़र में खोलें और फिर प्रयास करें।', modelFailed: 'मॉडल तैयार नहीं हो सका', modelRetry: 'फिर प्रयास करें', modelReload: 'रीलोड करें', modelDelete: 'हटाएँ', modelCancel: 'डाउनलोड रद्द करें', privacy: 'Gemma स्थानीय रूप से चलता है। पेज सामग्री आपके डिवाइस पर रहती है।', statusPageStopped: 'इस पेज पर रोका गया', statusSiteStopped: 'इस साइट पर रोका गया', statusExtensionStopped: 'GemMurmur बंद है', statusPaused: 'रुका हुआ', statusReady: 'तैयार', statusDownloading: 'डाउनलोड हो रहा है {percent}%', statusLoading: 'लोड हो रहा है', statusPrepare: 'मॉडल तैयार करें', runtimeWebGpuUnsupported: 'WebGPU उपलब्ध नहीं है।\nइस पेज को संगत ब्राउज़र में खोलें।', runtimeModelLoading: 'मॉडल लोड हो रहा है…', runtimeModelPending: 'Gemma तैयार हो रहा है…\nएक्सटेंशन पॉपअप से मॉडल लोड करें।', runtimePrivatePage: 'निजी पेजों पर GemMurmur उपलब्ध नहीं है।', runtimeModelLoadFailed: 'मॉडल लोड नहीं हो सका।\nफिर प्रयास करें।', runtimeMemoryError: 'पर्याप्त मेमोरी नहीं है।\nअन्य टैब या ऐप बंद करके फिर प्रयास करें।',
}

const ID: UiCopy = {
  tagline: 'Setiap halaman punya penonton.', version: 'Versi', comments: 'Komentar', toggleComments: 'Nyalakan atau matikan komentar', pageActions: 'Kontrol halaman', pause: 'Jeda', resume: 'Lanjutkan', stopPage: 'Hentikan di halaman ini', stopSite: 'Hentikan di situs ini', resumePage: 'Lanjutkan di halaman ini', commentLanguage: 'Bahasa komentar', automatic: 'Otomatis', localModel: 'Model lokal', modelReady: 'Siap', modelPrepare: 'Siapkan model', modelPreparing: 'Menyiapkan model', modelSaved: 'Tersimpan di perangkat ini', modelInitialSize: 'Unduhan pertama menyimpan sekitar 2,0 GB di perangkat ini.', modelSavedDetail: 'Menyimpan di perangkat ini. Konten halaman tidak meninggalkan perangkat.', modelUnsupported: 'WebGPU tidak tersedia', modelUnsupportedHelp: 'Buka di browser yang kompatibel lalu coba lagi.', modelFailed: 'Model tidak dapat disiapkan', modelRetry: 'Coba lagi', modelReload: 'Muat ulang', modelDelete: 'Hapus', modelCancel: 'Batalkan unduhan', privacy: 'Gemma berjalan secara lokal. Konten halaman tetap di perangkat Anda.', statusPageStopped: 'Dihentikan di halaman ini', statusSiteStopped: 'Dihentikan di situs ini', statusExtensionStopped: 'GemMurmur dihentikan', statusPaused: 'Dijeda', statusReady: 'Siap', statusDownloading: 'Mengunduh {percent}%', statusLoading: 'Memuat', statusPrepare: 'Siapkan model', runtimeWebGpuUnsupported: 'WebGPU tidak tersedia.\nBuka halaman ini di browser yang kompatibel.', runtimeModelLoading: 'Memuat model…', runtimeModelPending: 'Menyiapkan Gemma…\nMuat model dari popup ekstensi.', runtimePrivatePage: 'GemMurmur tidak tersedia di halaman pribadi.', runtimeModelLoadFailed: 'Model tidak dapat dimuat.\nCoba lagi.', runtimeMemoryError: 'Memori tidak cukup.\nTutup tab atau aplikasi lain lalu coba lagi.',
}

const TR: UiCopy = {
  tagline: 'Her sayfanın bir kitlesi vardır.', version: 'Sürüm', comments: 'Yorumlar', toggleComments: 'Yorumları aç veya kapat', pageActions: 'Sayfa denetimleri', pause: 'Duraklat', resume: 'Sürdür', stopPage: 'Bu sayfada durdur', stopSite: 'Bu sitede durdur', resumePage: 'Bu sayfada sürdür', commentLanguage: 'Yorum dili', automatic: 'Otomatik', localModel: 'Yerel model', modelReady: 'Hazır', modelPrepare: 'Modeli hazırla', modelPreparing: 'Model hazırlanıyor', modelSaved: 'Bu cihaza kaydedildi', modelInitialSize: 'İlk indirme bu cihaza yaklaşık 2,0 GB kaydeder.', modelSavedDetail: 'Bu cihaza kaydediliyor. Sayfa içeriği cihazınızdan ayrılmaz.', modelUnsupported: 'WebGPU kullanılamıyor', modelUnsupportedHelp: 'Uyumlu bir tarayıcıda açıp yeniden deneyin.', modelFailed: 'Model hazırlanamadı', modelRetry: 'Tekrar dene', modelReload: 'Yeniden yükle', modelDelete: 'Sil', modelCancel: 'İndirmeyi iptal et', privacy: 'Gemma yerel olarak çalışır. Sayfa içeriği cihazınızda kalır.', statusPageStopped: 'Bu sayfada durduruldu', statusSiteStopped: 'Bu sitede durduruldu', statusExtensionStopped: 'GemMurmur durduruldu', statusPaused: 'Duraklatıldı', statusReady: 'Hazır', statusDownloading: 'İndiriliyor {percent}%', statusLoading: 'Yükleniyor', statusPrepare: 'Modeli hazırlayın', runtimeWebGpuUnsupported: 'WebGPU kullanılamıyor.\nBu sayfayı uyumlu bir tarayıcıda açın.', runtimeModelLoading: 'Model yükleniyor…', runtimeModelPending: 'Gemma hazırlanıyor…\nModeli eklenti açılır penceresinden yükleyin.', runtimePrivatePage: 'GemMurmur özel sayfalarda kullanılamaz.', runtimeModelLoadFailed: 'Model yüklenemedi.\nTekrar deneyin.', runtimeMemoryError: 'Yeterli bellek yok.\nDiğer sekmeleri veya uygulamaları kapatıp yeniden deneyin.',
}

const VI: UiCopy = {
  tagline: 'Mỗi trang đều có khán giả.', version: 'Phiên bản', comments: 'Bình luận', toggleComments: 'Bật hoặc tắt bình luận', pageActions: 'Điều khiển trang', pause: 'Tạm dừng', resume: 'Tiếp tục', stopPage: 'Dừng ở trang này', stopSite: 'Dừng ở trang này', resumePage: 'Tiếp tục ở trang này', commentLanguage: 'Ngôn ngữ bình luận', automatic: 'Tự động', localModel: 'Mô hình cục bộ', modelReady: 'Sẵn sàng', modelPrepare: 'Chuẩn bị mô hình', modelPreparing: 'Đang chuẩn bị mô hình', modelSaved: 'Đã lưu trên thiết bị này', modelInitialSize: 'Lần tải đầu tiên lưu khoảng 2,0 GB trên thiết bị này.', modelSavedDetail: 'Đang lưu trên thiết bị này. Nội dung trang không rời khỏi thiết bị.', modelUnsupported: 'WebGPU không khả dụng', modelUnsupportedHelp: 'Mở trong trình duyệt tương thích rồi thử lại.', modelFailed: 'Không thể chuẩn bị mô hình', modelRetry: 'Thử lại', modelReload: 'Tải lại', modelDelete: 'Xóa', modelCancel: 'Hủy tải xuống', privacy: 'Gemma chạy cục bộ. Nội dung trang ở lại trên thiết bị của bạn.', statusPageStopped: 'Đã dừng ở trang này', statusSiteStopped: 'Đã dừng ở trang web này', statusExtensionStopped: 'GemMurmur đã dừng', statusPaused: 'Đã tạm dừng', statusReady: 'Sẵn sàng', statusDownloading: 'Đang tải {percent}%', statusLoading: 'Đang tải mô hình', statusPrepare: 'Chuẩn bị mô hình', runtimeWebGpuUnsupported: 'WebGPU không khả dụng.\nMở trang này trong trình duyệt tương thích.', runtimeModelLoading: 'Đang tải mô hình…', runtimeModelPending: 'Đang chuẩn bị Gemma…\nTải mô hình từ cửa sổ tiện ích.', runtimePrivatePage: 'GemMurmur không khả dụng trên trang riêng tư.', runtimeModelLoadFailed: 'Không thể tải mô hình.\nHãy thử lại.', runtimeMemoryError: 'Không đủ bộ nhớ.\nĐóng các tab hoặc ứng dụng khác rồi thử lại.',
}

const TH: UiCopy = {
  tagline: 'ทุกหน้ามีผู้ชม', version: 'เวอร์ชัน', comments: 'ความคิดเห็น', toggleComments: 'เปิดหรือปิดความคิดเห็น', pageActions: 'การควบคุมหน้าเว็บ', pause: 'หยุดชั่วคราว', resume: 'ทำต่อ', stopPage: 'หยุดในหน้านี้', stopSite: 'หยุดในเว็บไซต์นี้', resumePage: 'ทำต่อในหน้านี้', commentLanguage: 'ภาษาความคิดเห็น', automatic: 'อัตโนมัติ', localModel: 'โมเดลในเครื่อง', modelReady: 'พร้อมแล้ว', modelPrepare: 'เตรียมโมเดล', modelPreparing: 'กำลังเตรียมโมเดล', modelSaved: 'บันทึกในอุปกรณ์นี้แล้ว', modelInitialSize: 'การดาวน์โหลดครั้งแรกบันทึกประมาณ 2.0 GB ในอุปกรณ์นี้', modelSavedDetail: 'กำลังบันทึกในอุปกรณ์นี้ เนื้อหาหน้าเว็บจะไม่ออกจากอุปกรณ์', modelUnsupported: 'ไม่สามารถใช้ WebGPU ได้', modelUnsupportedHelp: 'เปิดในเบราว์เซอร์ที่รองรับแล้วลองใหม่', modelFailed: 'ไม่สามารถเตรียมโมเดลได้', modelRetry: 'ลองอีกครั้ง', modelReload: 'โหลดใหม่', modelDelete: 'ลบ', modelCancel: 'ยกเลิกการดาวน์โหลด', privacy: 'Gemma ทำงานในเครื่อง เนื้อหาหน้าเว็บอยู่ในอุปกรณ์ของคุณ', statusPageStopped: 'หยุดในหน้านี้แล้ว', statusSiteStopped: 'หยุดในเว็บไซต์นี้แล้ว', statusExtensionStopped: 'GemMurmur หยุดอยู่', statusPaused: 'หยุดชั่วคราว', statusReady: 'พร้อมแล้ว', statusDownloading: 'กำลังดาวน์โหลด {percent}%', statusLoading: 'กำลังโหลด', statusPrepare: 'เตรียมโมเดล', runtimeWebGpuUnsupported: 'ไม่สามารถใช้ WebGPU ได้\nเปิดหน้านี้ในเบราว์เซอร์ที่รองรับ', runtimeModelLoading: 'กำลังโหลดโมเดล…', runtimeModelPending: 'กำลังเตรียม Gemma…\nโหลดโมเดลจากหน้าต่างส่วนขยาย', runtimePrivatePage: 'GemMurmur ใช้ไม่ได้ในหน้าส่วนตัว', runtimeModelLoadFailed: 'ไม่สามารถโหลดโมเดลได้\nลองอีกครั้ง', runtimeMemoryError: 'หน่วยความจำไม่เพียงพอ\nปิดแท็บหรือแอปอื่นแล้วลองอีกครั้ง',
}

const COPY: Record<ResolvedLanguage, UiCopy> = {
  en: EN, ja: JA, 'zh-Hans': ZH_HANS, 'zh-Hant': ZH_HANT, es: ES, fr: FR, de: DE, 'pt-BR': PT_BR, it: IT, ko: KO, ru: RU, ar: AR, hi: HI, id: ID, tr: TR, vi: VI, th: TH,
}

export function uiLanguage(): ResolvedLanguage {
  const browserLanguage = typeof chrome !== 'undefined' ? chrome.i18n?.getUILanguage() : undefined
  return languageFromTag(browserLanguage) ?? 'en'
}

export function text(language: ResolvedLanguage, key: UiKey, variables: Record<string, string | number> = {}): string {
  return COPY[language][key].replace(/\{(\w+)\}/g, (_match, name: string) => String(variables[name] ?? ''))
}

export function languageLabel(language: ResolvedLanguage): string {
  return LANGUAGE_NAMES[language]
}

type BuzzKey = 'title' | 'help' | 'on' | 'off'

const BUZZ_COPY: Record<ResolvedLanguage, Record<BuzzKey, string>> = {
  en: { title: 'Buzz mode', help: 'Preview the high-density stream that appears after a long browsing session.', on: 'Turn on Buzz mode', off: 'Turn off Buzz mode' },
  ja: { title: 'バズモード', help: '長時間のネットサーフィンで現れる、超高密度なコメント表示を試せます。', on: 'バズモードをオン', off: 'バズモードをオフ' },
  'zh-Hans': { title: '弹幕模式', help: '预览长时间浏览后出现的超高密度评论流。', on: '开启弹幕模式', off: '关闭弹幕模式' },
  'zh-Hant': { title: '彈幕模式', help: '預覽長時間瀏覽後出現的超高密度留言流。', on: '開啟彈幕模式', off: '關閉彈幕模式' },
  es: { title: 'Modo explosión', help: 'Previsualiza el flujo ultradenso que aparece tras navegar durante mucho tiempo.', on: 'Activar modo explosión', off: 'Desactivar modo explosión' },
  fr: { title: 'Mode effervescence', help: 'Prévisualisez le flux très dense qui apparaît après une longue session de navigation.', on: 'Activer le mode effervescence', off: 'Désactiver le mode effervescence' },
  de: { title: 'Buzz-Modus', help: 'Vorschau des extrem dichten Kommentarstroms nach einer langen Browsing-Sitzung.', on: 'Buzz-Modus einschalten', off: 'Buzz-Modus ausschalten' },
  'pt-BR': { title: 'Modo agito', help: 'Prévia do fluxo superdenso que aparece após uma longa sessão de navegação.', on: 'Ativar modo agito', off: 'Desativar modo agito' },
  it: { title: 'Modalità fermento', help: 'Mostra il flusso ad altissima densità che appare dopo una lunga navigazione.', on: 'Attiva modalità fermento', off: 'Disattiva modalità fermento' },
  ko: { title: '버즈 모드', help: '오랫동안 웹을 탐색한 뒤 나타나는 초고밀도 댓글 흐름을 미리 볼 수 있습니다.', on: '버즈 모드 켜기', off: '버즈 모드 끄기' },
  ru: { title: 'Режим шума', help: 'Предпросмотр сверхплотного потока комментариев после долгого просмотра сайтов.', on: 'Включить режим шума', off: 'Выключить режим шума' },
  ar: { title: 'وضع الضجة', help: 'معاينة تدفق التعليقات الكثيف جدًا الذي يظهر بعد جلسة تصفح طويلة.', on: 'تشغيل وضع الضجة', off: 'إيقاف وضع الضجة' },
  hi: { title: 'बज़ मोड', help: 'लंबे समय तक ब्राउज़ करने के बाद दिखने वाली बहुत घनी टिप्पणी धारा का पूर्वावलोकन करें।', on: 'बज़ मोड चालू करें', off: 'बज़ मोड बंद करें' },
  id: { title: 'Mode ramai', help: 'Pratinjau aliran komentar sangat padat yang muncul setelah sesi menjelajah panjang.', on: 'Nyalakan mode ramai', off: 'Matikan mode ramai' },
  tr: { title: 'Coşku modu', help: 'Uzun bir gezinti oturumundan sonra görünen çok yoğun yorum akışını önizleyin.', on: 'Coşku modunu aç', off: 'Coşku modunu kapat' },
  vi: { title: 'Chế độ sôi động', help: 'Xem trước luồng bình luận siêu dày xuất hiện sau thời gian lướt web dài.', on: 'Bật chế độ sôi động', off: 'Tắt chế độ sôi động' },
  th: { title: 'โหมดคึกคัก', help: 'ดูตัวอย่างกระแสความคิดเห็นหนาแน่นมากที่ปรากฏหลังท่องเว็บเป็นเวลานาน', on: 'เปิดโหมดคึกคัก', off: 'ปิดโหมดคึกคัก' },
}

export function buzzText(language: ResolvedLanguage, key: BuzzKey): string {
  return BUZZ_COPY[language][key]
}

type SupportKey = 'title' | 'help'

const SUPPORT_COPY: Record<ResolvedLanguage, Record<SupportKey, string>> = {
  en: { title: 'Support GemMurmur', help: 'If GemMurmur made your browsing more delightful, you can support its continued development.' },
  ja: { title: 'GemMurmurを支援する', help: 'GemMurmurを気に入っていただけたら、これからの開発をコーヒー1杯ぶん支援できます。' },
  'zh-Hans': { title: '支持 GemMurmur', help: '如果 GemMurmur 让浏览变得更愉快，欢迎支持后续开发。' },
  'zh-Hant': { title: '支持 GemMurmur', help: '如果 GemMurmur 讓瀏覽變得更愉快，歡迎支持後續開發。' },
  es: { title: 'Apoya GemMurmur', help: 'Si GemMurmur hizo más agradable tu navegación, puedes apoyar su desarrollo.' },
  fr: { title: 'Soutenir GemMurmur', help: 'Si GemMurmur rend votre navigation plus agréable, vous pouvez soutenir son développement.' },
  de: { title: 'GemMurmur unterstützen', help: 'Wenn GemMurmur dein Surfen schöner macht, kannst du die Weiterentwicklung unterstützen.' },
  'pt-BR': { title: 'Apoie o GemMurmur', help: 'Se o GemMurmur deixou sua navegação mais agradável, você pode apoiar seu desenvolvimento.' },
  it: { title: 'Sostieni GemMurmur', help: 'Se GemMurmur ha reso più piacevole la tua navigazione, puoi sostenerne lo sviluppo.' },
  ko: { title: 'GemMurmur 지원', help: 'GemMurmur가 웹 탐색을 더 즐겁게 만들었다면, 앞으로의 개발을 지원할 수 있습니다.' },
  ru: { title: 'Поддержать GemMurmur', help: 'Если GemMurmur сделал ваш веб-серфинг приятнее, вы можете поддержать его развитие.' },
  ar: { title: 'ادعم GemMurmur', help: 'إذا جعل GemMurmur تصفحك أكثر متعة، يمكنك دعم تطويره المستمر.' },
  hi: { title: 'GemMurmur का समर्थन करें', help: 'अगर GemMurmur ने आपकी ब्राउज़िंग को अधिक आनंददायक बनाया है, तो आप इसके विकास का समर्थन कर सकते हैं।' },
  id: { title: 'Dukung GemMurmur', help: 'Jika GemMurmur membuat aktivitas menjelajah Anda lebih menyenangkan, Anda dapat mendukung pengembangannya.' },
  tr: { title: 'GemMurmur’u destekleyin', help: 'GemMurmur gezinmenizi daha keyifli yaptıysa, geliştirilmesini destekleyebilirsiniz.' },
  vi: { title: 'Ủng hộ GemMurmur', help: 'Nếu GemMurmur giúp việc duyệt web thú vị hơn, bạn có thể ủng hộ quá trình phát triển.' },
  th: { title: 'สนับสนุน GemMurmur', help: 'หาก GemMurmur ทำให้การท่องเว็บสนุกขึ้น คุณสามารถสนับสนุนการพัฒนาต่อไปได้' },
}

export function supportText(language: ResolvedLanguage, key: SupportKey): string {
  return SUPPORT_COPY[language][key]
}

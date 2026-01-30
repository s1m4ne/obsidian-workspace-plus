'use strict';

var obsidian = require('obsidian');

// ============================================================
// i18n Framework
// ============================================================

// Russian plural helper (3 forms: one, few, many)
function ruPlural(n, one, few, many) {
    var mod100 = Math.abs(n) % 100;
    var mod10 = mod100 % 10;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
}

// Arabic plural helper (singular for 1/11+, dual for 2, plural for 3-10)
function arPlural(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n <= 10) return n + ' ' + few;
    return n + ' ' + many;
}

var STRINGS = {
    en: {
        modalTitle: 'Manage sessions',
        savePlaceholder: 'New session name...',
        save: 'Create',
        load: 'Switch',
        active: 'ACTIVE',
        modifiedJustNow: 'Modified just now',
        modifiedMinutes: function (n) { return 'Modified ' + n + ' minute' + (n !== 1 ? 's' : '') + ' ago'; },
        modifiedHours: function (n) { return 'Modified ' + n + ' hour' + (n !== 1 ? 's' : '') + ' ago'; },
        modifiedDays: function (n) { return 'Modified ' + n + ' day' + (n !== 1 ? 's' : '') + ' ago'; },
        duplicateName: 'A session with this name already exists.',
        emptyName: 'Session name cannot be empty.',
        created: function (n) { return 'Session "' + n + '" created'; },
        deleted: function (n) { return 'Session "' + n + '" deleted'; },
        loaded: function (n) { return 'Switched to "' + n + '"'; },
        saved: function (n) { return 'Session "' + n + '" saved'; },
        renamed: function (o, n) { return 'Renamed "' + o + '" to "' + n + '"'; },
        confirmDelete: function (n) { return 'Delete session "' + n + '"?'; },
        confirmDeleteActive: function (n) { return '"' + n + '" is the active session. Delete anyway?'; },
        renameTitle: 'Rename session',
        renamePlaceholder: 'New name...',
        noSession: 'No session',
        cannotDeleteDefault: 'The default session cannot be deleted.',
        confirmBulkDelete: function (n) { return 'Delete ' + n + ' sessions?'; },
        bulkDeleted: function (n) { return n + ' sessions deleted'; },
        bulkDelete: function (n) { return 'Delete ' + n + ' sessions'; },
        cmdManage: 'Manage sessions',
        cmdCreate: 'Create new session',
        cmdRename: 'Rename current session',
        cmdDelete: 'Delete current session',
        cmdSave: 'Save current session now',
        deselect: 'Deselect',
        footerSwitch: 'Switch',
        footerDragReorder: 'Drag to reorder',
        defaultLabel: '(default)',
        rename: 'Rename',
        delete: 'Delete',
        cancel: 'Cancel',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Switch to session ' + n; },
        cmdPrevious: 'Previous session',
        cmdNext: 'Next session',
        footerHotkeyHint: 'Assign hotkeys to quickly jump to sessions by number.',
        backupRestored: 'Workspace++: Restored sessions from backup.',
        settingsLanguage: 'Language',
        settingsLanguageDesc: 'Plugin UI language. Restart Obsidian to apply to command names.',
        settingsLangAuto: 'Auto (system language)',
        settingsTranslationHelp: 'Found a translation error? Please open an issue or pull request on GitHub.',
    },
    ja: {
        modalTitle: 'セッション管理',
        savePlaceholder: '新しいセッション名...',
        save: '作成',
        load: '切替',
        active: 'Active',
        modifiedJustNow: 'たった今変更',
        modifiedMinutes: function (n) { return n + '分前に変更'; },
        modifiedHours: function (n) { return n + '時間前に変更'; },
        modifiedDays: function (n) { return n + '日前に変更'; },
        duplicateName: '同じ名前のセッションが既に存在します。',
        emptyName: 'セッション名を入力してください。',
        created: function (n) { return 'セッション「' + n + '」を作成しました'; },
        deleted: function (n) { return 'セッション「' + n + '」を削除しました'; },
        loaded: function (n) { return '「' + n + '」に切り替えました'; },
        saved: function (n) { return 'セッション「' + n + '」を保存しました'; },
        renamed: function (o, n) { return '「' + o + '」を「' + n + '」に名前変更しました'; },
        confirmDelete: function (n) { return 'セッション「' + n + '」を削除しますか？'; },
        confirmDeleteActive: function (n) { return '「' + n + '」はアクティブなセッションです。削除しますか？'; },
        renameTitle: 'セッション名の変更',
        renamePlaceholder: '新しい名前...',
        noSession: 'セッションなし',
        cannotDeleteDefault: 'デフォルトセッションは削除できません。',
        confirmBulkDelete: function (n) { return n + '件のセッションを削除しますか？'; },
        bulkDeleted: function (n) { return n + '件のセッションを削除しました'; },
        bulkDelete: function (n) { return n + '件を削除'; },
        cmdManage: 'セッション管理',
        cmdCreate: '新しいセッションを作成',
        cmdRename: '現在のセッション名を変更',
        cmdDelete: '現在のセッションを削除',
        cmdSave: '現在のセッションを保存',
        deselect: '選択解除',
        footerSwitch: '切替',
        footerDragReorder: 'ドラッグで並べ替え',
        defaultLabel: '（デフォルト）',
        rename: '名前変更',
        delete: '削除',
        cancel: 'キャンセル',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'セッション ' + n + ' に切り替え'; },
        cmdPrevious: '前のセッション',
        cmdNext: '次のセッション',
        footerHotkeyHint: 'ホットキーを設定すると番号でセッションにジャンプできます。',
        backupRestored: 'Workspace++: バックアップからセッションを復元しました。',
        settingsLanguage: '言語',
        settingsLanguageDesc: 'プラグインの表示言語。コマンド名への反映にはObsidianの再起動が必要です。',
        settingsLangAuto: '自動（システム言語）',
        settingsTranslationHelp: '翻訳の誤りを見つけたら、GitHubでissueまたはPull requestをお願いします。',
    },
    zh: {
        modalTitle: '管理会话',
        savePlaceholder: '新会话名称…',
        save: '创建',
        load: '切换',
        active: 'Active',
        modifiedJustNow: '刚刚修改',
        modifiedMinutes: function (n) { return n + ' 分钟前修改'; },
        modifiedHours: function (n) { return n + ' 小时前修改'; },
        modifiedDays: function (n) { return n + ' 天前修改'; },
        duplicateName: '已存在同名会话。',
        emptyName: '会话名称不能为空。',
        created: function (n) { return '已创建会话\u201c' + n + '\u201d'; },
        deleted: function (n) { return '已删除会话\u201c' + n + '\u201d'; },
        loaded: function (n) { return '已切换至\u201c' + n + '\u201d'; },
        saved: function (n) { return '已保存会话\u201c' + n + '\u201d'; },
        renamed: function (o, n) { return '已将\u201c' + o + '\u201d重命名为\u201c' + n + '\u201d'; },
        confirmDelete: function (n) { return '确定删除会话\u201c' + n + '\u201d？'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d是当前活动会话，确定删除？'; },
        renameTitle: '重命名会话',
        renamePlaceholder: '新名称…',
        noSession: '无会话',
        cannotDeleteDefault: '默认会话无法删除。',
        confirmBulkDelete: function (n) { return '确定删除 ' + n + ' 个会话？'; },
        bulkDeleted: function (n) { return '已删除 ' + n + ' 个会话'; },
        bulkDelete: function (n) { return '删除 ' + n + ' 个会话'; },
        cmdManage: '管理会话',
        cmdCreate: '创建新会话',
        cmdRename: '重命名当前会话',
        cmdDelete: '删除当前会话',
        cmdSave: '保存当前会话',
        deselect: '取消选择',
        footerSwitch: '切换',
        footerDragReorder: '拖拽排序',
        defaultLabel: '（默认）',
        rename: '重命名',
        delete: '删除',
        cancel: '取消',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return '切换至会话 ' + n; },
        cmdPrevious: '上一个会话',
        cmdNext: '下一个会话',
        footerHotkeyHint: '设置快捷键后可通过编号快速跳转至对应会话。',
        backupRestored: 'Workspace++: 已从备份恢复会话。',
        settingsLanguage: '语言',
        settingsLanguageDesc: '插件界面语言。重启 Obsidian 后命令名称才会更新。',
        settingsLangAuto: '自动（系统语言）',
        settingsTranslationHelp: '发现翻译错误？请在 GitHub 上提交 issue 或 Pull request。',
    },
    'zh-TW': {
        modalTitle: '管理工作階段',
        savePlaceholder: '新工作階段名稱\u2026',
        save: '建立',
        load: '切換',
        active: 'Active',
        modifiedJustNow: '剛剛修改',
        modifiedMinutes: function (n) { return n + ' 分鐘前修改'; },
        modifiedHours: function (n) { return n + ' 小時前修改'; },
        modifiedDays: function (n) { return n + ' 天前修改'; },
        duplicateName: '已有同名的工作階段。',
        emptyName: '工作階段名稱不可為空。',
        created: function (n) { return '已建立工作階段「' + n + '」'; },
        deleted: function (n) { return '已刪除工作階段「' + n + '」'; },
        loaded: function (n) { return '已切換至「' + n + '」'; },
        saved: function (n) { return '已儲存工作階段「' + n + '」'; },
        renamed: function (o, n) { return '已將「' + o + '」重新命名為「' + n + '」'; },
        confirmDelete: function (n) { return '確定刪除工作階段「' + n + '」？'; },
        confirmDeleteActive: function (n) { return '「' + n + '」是目前使用中的工作階段，確定刪除？'; },
        renameTitle: '重新命名工作階段',
        renamePlaceholder: '新名稱\u2026',
        noSession: '無工作階段',
        cannotDeleteDefault: '預設工作階段無法刪除。',
        confirmBulkDelete: function (n) { return '確定刪除 ' + n + ' 個工作階段？'; },
        bulkDeleted: function (n) { return '已刪除 ' + n + ' 個工作階段'; },
        bulkDelete: function (n) { return '刪除 ' + n + ' 個工作階段'; },
        cmdManage: '管理工作階段',
        cmdCreate: '建立新工作階段',
        cmdRename: '重新命名目前的工作階段',
        cmdDelete: '刪除目前的工作階段',
        cmdSave: '儲存目前的工作階段',
        deselect: '取消選取',
        footerSwitch: '切換',
        footerDragReorder: '拖曳排序',
        defaultLabel: '（預設）',
        rename: '重新命名',
        delete: '刪除',
        cancel: '取消',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return '切換至工作階段 ' + n; },
        cmdPrevious: '上一個工作階段',
        cmdNext: '下一個工作階段',
        footerHotkeyHint: '設定快捷鍵後可透過編號快速跳至對應工作階段。',
        backupRestored: 'Workspace++: 已從備份還原工作階段。',
        settingsLanguage: '語言',
        settingsLanguageDesc: '外掛介面語言。重新啟動 Obsidian 後命令名稱才會更新。',
        settingsLangAuto: '自動（系統語言）',
        settingsTranslationHelp: '發現翻譯錯誤？請在 GitHub 上提交 issue 或 Pull request。',
    },
    ko: {
        modalTitle: '세션 관리',
        savePlaceholder: '새 세션 이름...',
        save: '만들기',
        load: '전환',
        active: 'Active',
        modifiedJustNow: '방금 수정됨',
        modifiedMinutes: function (n) { return n + '분 전 수정됨'; },
        modifiedHours: function (n) { return n + '시간 전 수정됨'; },
        modifiedDays: function (n) { return n + '일 전 수정됨'; },
        duplicateName: '같은 이름의 세션이 이미 존재합니다.',
        emptyName: '세션 이름을 입력해 주세요.',
        created: function (n) { return '\u201c' + n + '\u201d 세션을 만들었습니다'; },
        deleted: function (n) { return '\u201c' + n + '\u201d 세션을 삭제했습니다'; },
        loaded: function (n) { return '\u201c' + n + '\u201d 세션으로 전환했습니다'; },
        saved: function (n) { return '\u201c' + n + '\u201d 세션을 저장했습니다'; },
        renamed: function (o, n) { return '이름 변경: \u201c' + o + '\u201d → \u201c' + n + '\u201d'; },
        confirmDelete: function (n) { return '\u201c' + n + '\u201d 세션을 삭제하시겠습니까?'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d 세션은 현재 사용 중입니다. 삭제하시겠습니까?'; },
        renameTitle: '세션 이름 변경',
        renamePlaceholder: '새 이름...',
        noSession: '세션 없음',
        cannotDeleteDefault: '기본 세션은 삭제할 수 없습니다.',
        confirmBulkDelete: function (n) { return n + '개 세션을 삭제하시겠습니까?'; },
        bulkDeleted: function (n) { return n + '개 세션을 삭제했습니다'; },
        bulkDelete: function (n) { return n + '개 세션 삭제'; },
        cmdManage: '세션 관리',
        cmdCreate: '새 세션 만들기',
        cmdRename: '현재 세션 이름 변경',
        cmdDelete: '현재 세션 삭제',
        cmdSave: '현재 세션 저장',
        deselect: '선택 해제',
        footerSwitch: '전환',
        footerDragReorder: '드래그하여 정렬',
        defaultLabel: '（기본）',
        rename: '이름 변경',
        delete: '삭제',
        cancel: '취소',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return '세션 ' + n + ' 전환'; },
        cmdPrevious: '이전 세션',
        cmdNext: '다음 세션',
        footerHotkeyHint: '단축키를 설정하면 번호로 세션에 빠르게 이동할 수 있습니다.',
        backupRestored: 'Workspace++: 백업에서 세션을 복원했습니다.',
        settingsLanguage: '언어',
        settingsLanguageDesc: '플러그인 UI 언어. 명령어 이름에 적용하려면 Obsidian을 다시 시작하세요.',
        settingsLangAuto: '자동 (시스템 언어)',
        settingsTranslationHelp: '번역 오류를 발견하셨나요? GitHub에서 issue 또는 Pull request를 보내주세요.',
    },
    fr: {
        modalTitle: 'Gestion des sessions',
        savePlaceholder: 'Nom de la nouvelle session...',
        save: 'Créer',
        load: 'Basculer',
        active: 'Active',
        modifiedJustNow: 'Modifié à l\'instant',
        modifiedMinutes: function (n) { return 'Modifié il y a ' + n + ' minute' + (n !== 1 ? 's' : ''); },
        modifiedHours: function (n) { return 'Modifié il y a ' + n + ' heure' + (n !== 1 ? 's' : ''); },
        modifiedDays: function (n) { return 'Modifié il y a ' + n + ' jour' + (n !== 1 ? 's' : ''); },
        duplicateName: 'Une session avec ce nom existe déjà.',
        emptyName: 'Le nom de la session ne peut pas être vide.',
        created: function (n) { return 'Session \u00ab\u00a0' + n + '\u00a0\u00bb créée'; },
        deleted: function (n) { return 'Session \u00ab\u00a0' + n + '\u00a0\u00bb supprimée'; },
        loaded: function (n) { return 'Basculé vers \u00ab\u00a0' + n + '\u00a0\u00bb'; },
        saved: function (n) { return 'Session \u00ab\u00a0' + n + '\u00a0\u00bb enregistrée'; },
        renamed: function (o, n) { return '\u00ab\u00a0' + o + '\u00a0\u00bb renommé en \u00ab\u00a0' + n + '\u00a0\u00bb'; },
        confirmDelete: function (n) { return 'Supprimer la session \u00ab\u00a0' + n + '\u00a0\u00bb ?'; },
        confirmDeleteActive: function (n) { return '\u00ab\u00a0' + n + '\u00a0\u00bb est la session active. Supprimer quand même ?'; },
        renameTitle: 'Renommer la session',
        renamePlaceholder: 'Nouveau nom...',
        noSession: 'Aucune session',
        cannotDeleteDefault: 'La session par défaut ne peut pas être supprimée.',
        confirmBulkDelete: function (n) { return 'Supprimer ' + n + ' session' + (n !== 1 ? 's' : '') + ' ?'; },
        bulkDeleted: function (n) { return n + ' session' + (n !== 1 ? 's' : '') + ' supprimée' + (n !== 1 ? 's' : ''); },
        bulkDelete: function (n) { return 'Supprimer ' + n + ' session' + (n !== 1 ? 's' : ''); },
        cmdManage: 'Gérer les sessions',
        cmdCreate: 'Créer une nouvelle session',
        cmdRename: 'Renommer la session en cours',
        cmdDelete: 'Supprimer la session en cours',
        cmdSave: 'Enregistrer la session en cours',
        deselect: 'Désélectionner',
        footerSwitch: 'Basculer',
        footerDragReorder: 'Glisser pour réorganiser',
        defaultLabel: '(par défaut)',
        rename: 'Renommer',
        delete: 'Supprimer',
        cancel: 'Annuler',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Basculer vers la session ' + n; },
        cmdPrevious: 'Session précédente',
        cmdNext: 'Session suivante',
        footerHotkeyHint: 'Assignez des raccourcis pour acc\u00e9der rapidement aux sessions par num\u00e9ro.',
        backupRestored: 'Workspace++ : sessions restaurées depuis la sauvegarde.',
        settingsLanguage: 'Langue',
        settingsLanguageDesc: 'Langue de l\'interface. Red\u00e9marrez Obsidian pour appliquer aux noms de commandes.',
        settingsLangAuto: 'Auto (langue du syst\u00e8me)',
        settingsTranslationHelp: 'Erreur de traduction ? Ouvrez une issue ou une pull request sur GitHub.',
    },
    es: {
        modalTitle: 'Gestión de sesiones',
        savePlaceholder: 'Nombre de la nueva sesión...',
        save: 'Crear',
        load: 'Cambiar',
        active: 'Active',
        modifiedJustNow: 'Modificado hace un momento',
        modifiedMinutes: function (n) { return 'Modificado hace ' + n + ' minuto' + (n !== 1 ? 's' : ''); },
        modifiedHours: function (n) { return 'Modificado hace ' + n + ' hora' + (n !== 1 ? 's' : ''); },
        modifiedDays: function (n) { return 'Modificado hace ' + n + ' día' + (n !== 1 ? 's' : ''); },
        duplicateName: 'Ya existe una sesión con este nombre.',
        emptyName: 'El nombre de la sesión no puede estar vacío.',
        created: function (n) { return 'Sesión \u00ab' + n + '\u00bb creada'; },
        deleted: function (n) { return 'Sesión \u00ab' + n + '\u00bb eliminada'; },
        loaded: function (n) { return 'Cambiado a \u00ab' + n + '\u00bb'; },
        saved: function (n) { return 'Sesión \u00ab' + n + '\u00bb guardada'; },
        renamed: function (o, n) { return '\u00ab' + o + '\u00bb renombrado a \u00ab' + n + '\u00bb'; },
        confirmDelete: function (n) { return '¿Eliminar la sesión \u00ab' + n + '\u00bb?'; },
        confirmDeleteActive: function (n) { return '\u00ab' + n + '\u00bb es la sesión activa. ¿Eliminar de todas formas?'; },
        renameTitle: 'Renombrar sesión',
        renamePlaceholder: 'Nuevo nombre...',
        noSession: 'Sin sesión',
        cannotDeleteDefault: 'La sesión por defecto no se puede eliminar.',
        confirmBulkDelete: function (n) { return '¿Eliminar ' + n + (n !== 1 ? ' sesiones' : ' sesión') + '?'; },
        bulkDeleted: function (n) { return n + (n !== 1 ? ' sesiones eliminadas' : ' sesión eliminada'); },
        bulkDelete: function (n) { return 'Eliminar ' + n + (n !== 1 ? ' sesiones' : ' sesión'); },
        cmdManage: 'Gestionar sesiones',
        cmdCreate: 'Crear nueva sesión',
        cmdRename: 'Renombrar sesión actual',
        cmdDelete: 'Eliminar sesión actual',
        cmdSave: 'Guardar sesión actual',
        deselect: 'Deseleccionar',
        footerSwitch: 'Cambiar',
        footerDragReorder: 'Arrastrar para reordenar',
        defaultLabel: '(por defecto)',
        rename: 'Renombrar',
        delete: 'Eliminar',
        cancel: 'Cancelar',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Cambiar a la sesión ' + n; },
        cmdPrevious: 'Sesión anterior',
        cmdNext: 'Sesión siguiente',
        footerHotkeyHint: 'Asigne atajos de teclado para saltar r\u00e1pidamente a sesiones por n\u00famero.',
        backupRestored: 'Workspace++: sesiones restauradas desde la copia de seguridad.',
        settingsLanguage: 'Idioma',
        settingsLanguageDesc: 'Idioma de la interfaz. Reinicie Obsidian para aplicar a los nombres de comandos.',
        settingsLangAuto: 'Auto (idioma del sistema)',
        settingsTranslationHelp: '\u00bfError de traducci\u00f3n? Abra un issue o pull request en GitHub.',
    },
    de: {
        modalTitle: 'Sitzungen verwalten',
        savePlaceholder: 'Neuer Sitzungsname...',
        save: 'Erstellen',
        load: 'Wechseln',
        active: 'Active',
        modifiedJustNow: 'Gerade eben geändert',
        modifiedMinutes: function (n) { return 'Vor ' + n + ' Minute' + (n !== 1 ? 'n' : '') + ' geändert'; },
        modifiedHours: function (n) { return 'Vor ' + n + ' Stunde' + (n !== 1 ? 'n' : '') + ' geändert'; },
        modifiedDays: function (n) { return 'Vor ' + n + ' Tag' + (n !== 1 ? 'en' : '') + ' geändert'; },
        duplicateName: 'Eine Sitzung mit diesem Namen existiert bereits.',
        emptyName: 'Der Sitzungsname darf nicht leer sein.',
        created: function (n) { return 'Sitzung \u201e' + n + '\u201c erstellt'; },
        deleted: function (n) { return 'Sitzung \u201e' + n + '\u201c gelöscht'; },
        loaded: function (n) { return 'Gewechselt zu \u201e' + n + '\u201c'; },
        saved: function (n) { return 'Sitzung \u201e' + n + '\u201c gespeichert'; },
        renamed: function (o, n) { return '\u201e' + o + '\u201c umbenannt in \u201e' + n + '\u201c'; },
        confirmDelete: function (n) { return 'Sitzung \u201e' + n + '\u201c löschen?'; },
        confirmDeleteActive: function (n) { return '\u201e' + n + '\u201c ist die aktive Sitzung. Trotzdem löschen?'; },
        renameTitle: 'Sitzung umbenennen',
        renamePlaceholder: 'Neuer Name...',
        noSession: 'Keine Sitzung',
        cannotDeleteDefault: 'Die Standardsitzung kann nicht gelöscht werden.',
        confirmBulkDelete: function (n) { return n + ' Sitzung' + (n !== 1 ? 'en' : '') + ' löschen?'; },
        bulkDeleted: function (n) { return n + ' Sitzung' + (n !== 1 ? 'en' : '') + ' gelöscht'; },
        bulkDelete: function (n) { return n + ' Sitzung' + (n !== 1 ? 'en' : '') + ' löschen'; },
        cmdManage: 'Sitzungen verwalten',
        cmdCreate: 'Neue Sitzung erstellen',
        cmdRename: 'Aktuelle Sitzung umbenennen',
        cmdDelete: 'Aktuelle Sitzung löschen',
        cmdSave: 'Aktuelle Sitzung speichern',
        deselect: 'Auswahl aufheben',
        footerSwitch: 'Wechseln',
        footerDragReorder: 'Ziehen zum Neuordnen',
        defaultLabel: '(Standard)',
        rename: 'Umbenennen',
        delete: 'Löschen',
        cancel: 'Abbrechen',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Zu Sitzung ' + n + ' wechseln'; },
        cmdPrevious: 'Vorherige Sitzung',
        cmdNext: 'Nächste Sitzung',
        footerHotkeyHint: 'Tastenkombinationen zuweisen, um per Nummer schnell zu Sitzungen zu springen.',
        backupRestored: 'Workspace++: Sitzungen aus Sicherung wiederhergestellt.',
        settingsLanguage: 'Sprache',
        settingsLanguageDesc: 'Sprache der Oberfl\u00e4che. Starten Sie Obsidian neu, um Befehlsnamen zu aktualisieren.',
        settingsLangAuto: 'Automatisch (Systemsprache)',
        settingsTranslationHelp: '\u00dcbersetzungsfehler gefunden? Erstellen Sie ein Issue oder einen Pull Request auf GitHub.',
    },
    pt: {
        modalTitle: 'Gerenciar sessões',
        savePlaceholder: 'Nome da nova sessão...',
        save: 'Criar',
        load: 'Alternar',
        active: 'Active',
        modifiedJustNow: 'Modificado agora mesmo',
        modifiedMinutes: function (n) { return 'Modificado há ' + n + ' minuto' + (n !== 1 ? 's' : ''); },
        modifiedHours: function (n) { return 'Modificado há ' + n + ' hora' + (n !== 1 ? 's' : ''); },
        modifiedDays: function (n) { return 'Modificado há ' + n + ' dia' + (n !== 1 ? 's' : ''); },
        duplicateName: 'Já existe uma sessão com este nome.',
        emptyName: 'O nome da sessão não pode estar vazio.',
        created: function (n) { return 'Sessão \u201c' + n + '\u201d criada'; },
        deleted: function (n) { return 'Sessão \u201c' + n + '\u201d excluída'; },
        loaded: function (n) { return 'Alternado para \u201c' + n + '\u201d'; },
        saved: function (n) { return 'Sessão \u201c' + n + '\u201d salva'; },
        renamed: function (o, n) { return '\u201c' + o + '\u201d renomeado para \u201c' + n + '\u201d'; },
        confirmDelete: function (n) { return 'Excluir a sessão \u201c' + n + '\u201d?'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d é a sessão ativa. Excluir mesmo assim?'; },
        renameTitle: 'Renomear sessão',
        renamePlaceholder: 'Novo nome...',
        noSession: 'Nenhuma sessão',
        cannotDeleteDefault: 'A sessão padrão não pode ser excluída.',
        confirmBulkDelete: function (n) { return 'Excluir ' + n + (n !== 1 ? ' sessões' : ' sessão') + '?'; },
        bulkDeleted: function (n) { return n + (n !== 1 ? ' sessões excluídas' : ' sessão excluída'); },
        bulkDelete: function (n) { return 'Excluir ' + n + (n !== 1 ? ' sessões' : ' sessão'); },
        cmdManage: 'Gerenciar sessões',
        cmdCreate: 'Criar nova sessão',
        cmdRename: 'Renomear sessão atual',
        cmdDelete: 'Excluir sessão atual',
        cmdSave: 'Salvar sessão atual',
        deselect: 'Desmarcar',
        footerSwitch: 'Alternar',
        footerDragReorder: 'Arrastar para reordenar',
        defaultLabel: '(padrão)',
        rename: 'Renomear',
        delete: 'Excluir',
        cancel: 'Cancelar',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Alternar para a sessão ' + n; },
        cmdPrevious: 'Sessão anterior',
        cmdNext: 'Próxima sessão',
        footerHotkeyHint: 'Atribua atalhos para saltar rapidamente para sess\u00f5es por n\u00famero.',
        backupRestored: 'Workspace++: sessões restauradas a partir do backup.',
        settingsLanguage: 'Idioma',
        settingsLanguageDesc: 'Idioma da interface. Reinicie o Obsidian para aplicar aos nomes dos comandos.',
        settingsLangAuto: 'Auto (idioma do sistema)',
        settingsTranslationHelp: 'Encontrou um erro de tradu\u00e7\u00e3o? Abra uma issue ou pull request no GitHub.',
    },
    id: {
        modalTitle: 'Kelola sesi',
        savePlaceholder: 'Nama sesi baru...',
        save: 'Buat',
        load: 'Beralih',
        active: 'Active',
        modifiedJustNow: 'Baru saja diubah',
        modifiedMinutes: function (n) { return 'Diubah ' + n + ' menit lalu'; },
        modifiedHours: function (n) { return 'Diubah ' + n + ' jam lalu'; },
        modifiedDays: function (n) { return 'Diubah ' + n + ' hari lalu'; },
        duplicateName: 'Sesi dengan nama ini sudah ada.',
        emptyName: 'Nama sesi tidak boleh kosong.',
        created: function (n) { return 'Sesi \u201c' + n + '\u201d dibuat'; },
        deleted: function (n) { return 'Sesi \u201c' + n + '\u201d dihapus'; },
        loaded: function (n) { return 'Beralih ke \u201c' + n + '\u201d'; },
        saved: function (n) { return 'Sesi \u201c' + n + '\u201d disimpan'; },
        renamed: function (o, n) { return '\u201c' + o + '\u201d diganti nama menjadi \u201c' + n + '\u201d'; },
        confirmDelete: function (n) { return 'Hapus sesi \u201c' + n + '\u201d?'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d adalah sesi aktif. Tetap hapus?'; },
        renameTitle: 'Ganti nama sesi',
        renamePlaceholder: 'Nama baru...',
        noSession: 'Tidak ada sesi',
        cannotDeleteDefault: 'Sesi bawaan tidak dapat dihapus.',
        confirmBulkDelete: function (n) { return 'Hapus ' + n + ' sesi?'; },
        bulkDeleted: function (n) { return n + ' sesi dihapus'; },
        bulkDelete: function (n) { return 'Hapus ' + n + ' sesi'; },
        cmdManage: 'Kelola sesi',
        cmdCreate: 'Buat sesi baru',
        cmdRename: 'Ganti nama sesi saat ini',
        cmdDelete: 'Hapus sesi saat ini',
        cmdSave: 'Simpan sesi saat ini',
        deselect: 'Batalkan pilihan',
        footerSwitch: 'Beralih',
        footerDragReorder: 'Seret untuk mengurutkan',
        defaultLabel: '(bawaan)',
        rename: 'Ganti nama',
        delete: 'Hapus',
        cancel: 'Batal',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Beralih ke sesi ' + n; },
        cmdPrevious: 'Sesi sebelumnya',
        cmdNext: 'Sesi berikutnya',
        footerHotkeyHint: 'Tetapkan pintasan untuk langsung beralih ke sesi berdasarkan nomor.',
        backupRestored: 'Workspace++: sesi dipulihkan dari cadangan.',
        settingsLanguage: 'Bahasa',
        settingsLanguageDesc: 'Bahasa antarmuka plugin. Mulai ulang Obsidian untuk menerapkan ke nama perintah.',
        settingsLangAuto: 'Otomatis (bahasa sistem)',
        settingsTranslationHelp: 'Menemukan kesalahan terjemahan? Silakan buka issue atau pull request di GitHub.',
    },
    ru: {
        modalTitle: 'Управление сессиями',
        savePlaceholder: 'Имя новой сессии...',
        save: 'Создать',
        load: 'Перейти',
        active: 'Active',
        modifiedJustNow: 'Только что изменено',
        modifiedMinutes: function (n) { return 'Изменено ' + n + ' ' + ruPlural(n, 'минуту', 'минуты', 'минут') + ' назад'; },
        modifiedHours: function (n) { return 'Изменено ' + n + ' ' + ruPlural(n, 'час', 'часа', 'часов') + ' назад'; },
        modifiedDays: function (n) { return 'Изменено ' + n + ' ' + ruPlural(n, 'день', 'дня', 'дней') + ' назад'; },
        duplicateName: 'Сессия с таким именем уже существует.',
        emptyName: 'Имя сессии не может быть пустым.',
        created: function (n) { return 'Сессия \u00ab' + n + '\u00bb создана'; },
        deleted: function (n) { return 'Сессия \u00ab' + n + '\u00bb удалена'; },
        loaded: function (n) { return 'Переключено на \u00ab' + n + '\u00bb'; },
        saved: function (n) { return 'Сессия \u00ab' + n + '\u00bb сохранена'; },
        renamed: function (o, n) { return '\u00ab' + o + '\u00bb переименована в \u00ab' + n + '\u00bb'; },
        confirmDelete: function (n) { return 'Удалить сессию \u00ab' + n + '\u00bb?'; },
        confirmDeleteActive: function (n) { return '\u00ab' + n + '\u00bb \u2014 активная сессия. Всё равно удалить?'; },
        renameTitle: 'Переименовать сессию',
        renamePlaceholder: 'Новое имя...',
        noSession: 'Нет сессий',
        cannotDeleteDefault: 'Сессию по умолчанию нельзя удалить.',
        confirmBulkDelete: function (n) { return 'Удалить ' + n + ' ' + ruPlural(n, 'сессию', 'сессии', 'сессий') + '?'; },
        bulkDeleted: function (n) { return n + ' ' + ruPlural(n, 'сессия удалена', 'сессии удалены', 'сессий удалено'); },
        bulkDelete: function (n) { return 'Удалить ' + n + ' ' + ruPlural(n, 'сессию', 'сессии', 'сессий'); },
        cmdManage: 'Управление сессиями',
        cmdCreate: 'Создать новую сессию',
        cmdRename: 'Переименовать текущую сессию',
        cmdDelete: 'Удалить текущую сессию',
        cmdSave: 'Сохранить текущую сессию',
        deselect: 'Снять выделение',
        footerSwitch: 'Перейти',
        footerDragReorder: 'Перетащите для сортировки',
        defaultLabel: '(по умолчанию)',
        rename: 'Переименовать',
        delete: 'Удалить',
        cancel: 'Отмена',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Перейти к сессии ' + n; },
        cmdPrevious: 'Предыдущая сессия',
        cmdNext: 'Следующая сессия',
        footerHotkeyHint: '\u041d\u0430\u0437\u043d\u0430\u0447\u044c\u0442\u0435 \u0433\u043e\u0440\u044f\u0447\u0438\u0435 \u043a\u043b\u0430\u0432\u0438\u0448\u0438 \u0434\u043b\u044f \u0431\u044b\u0441\u0442\u0440\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430 \u043a \u0441\u0435\u0441\u0441\u0438\u044f\u043c \u043f\u043e \u043d\u043e\u043c\u0435\u0440\u0443.',
        backupRestored: 'Workspace++: сессии восстановлены из резервной копии.',
        settingsLanguage: 'Язык',
        settingsLanguageDesc: 'Язык интерфейса плагина. Перезапустите Obsidian для обновления названий команд.',
        settingsLangAuto: 'Авто (язык системы)',
        settingsTranslationHelp: 'Нашли ошибку в переводе? Создайте issue или pull request на GitHub.',
    },
    it: {
        modalTitle: 'Gestione sessioni',
        savePlaceholder: 'Nome nuova sessione...',
        save: 'Crea',
        load: 'Passa',
        active: 'Active',
        modifiedJustNow: 'Modificato ora',
        modifiedMinutes: function (n) { return 'Modificato ' + n + ' minut' + (n !== 1 ? 'i' : 'o') + ' fa'; },
        modifiedHours: function (n) { return 'Modificato ' + n + ' or' + (n !== 1 ? 'e' : 'a') + ' fa'; },
        modifiedDays: function (n) { return 'Modificato ' + n + ' giorn' + (n !== 1 ? 'i' : 'o') + ' fa'; },
        duplicateName: 'Esiste gi\u00e0 una sessione con questo nome.',
        emptyName: 'Il nome della sessione non pu\u00f2 essere vuoto.',
        created: function (n) { return 'Sessione \u00ab' + n + '\u00bb creata'; },
        deleted: function (n) { return 'Sessione \u00ab' + n + '\u00bb eliminata'; },
        loaded: function (n) { return 'Passato a \u00ab' + n + '\u00bb'; },
        saved: function (n) { return 'Sessione \u00ab' + n + '\u00bb salvata'; },
        renamed: function (o, n) { return '\u00ab' + o + '\u00bb rinominata in \u00ab' + n + '\u00bb'; },
        confirmDelete: function (n) { return 'Eliminare la sessione \u00ab' + n + '\u00bb?'; },
        confirmDeleteActive: function (n) { return '\u00ab' + n + '\u00bb \u00e8 la sessione attiva. Eliminare comunque?'; },
        renameTitle: 'Rinomina sessione',
        renamePlaceholder: 'Nuovo nome...',
        noSession: 'Nessuna sessione',
        cannotDeleteDefault: 'La sessione predefinita non pu\u00f2 essere eliminata.',
        confirmBulkDelete: function (n) { return 'Eliminare ' + n + ' session' + (n !== 1 ? 'i' : 'e') + '?'; },
        bulkDeleted: function (n) { return n + ' session' + (n !== 1 ? 'i eliminate' : 'e eliminata'); },
        bulkDelete: function (n) { return 'Elimina ' + n + ' session' + (n !== 1 ? 'i' : 'e'); },
        cmdManage: 'Gestisci sessioni',
        cmdCreate: 'Crea nuova sessione',
        cmdRename: 'Rinomina sessione corrente',
        cmdDelete: 'Elimina sessione corrente',
        cmdSave: 'Salva sessione corrente',
        deselect: 'Deseleziona',
        footerSwitch: 'Passa',
        footerDragReorder: 'Trascina per riordinare',
        defaultLabel: '(predefinita)',
        rename: 'Rinomina',
        delete: 'Elimina',
        cancel: 'Annulla',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return 'Passa alla sessione ' + n; },
        cmdPrevious: 'Sessione precedente',
        cmdNext: 'Sessione successiva',
        footerHotkeyHint: 'Assegna scorciatoie per passare rapidamente alle sessioni per numero.',
        backupRestored: 'Workspace++: sessioni ripristinate dal backup.',
        settingsLanguage: 'Lingua',
        settingsLanguageDesc: 'Lingua dell\'interfaccia. Riavvia Obsidian per applicare ai nomi dei comandi.',
        settingsLangAuto: 'Auto (lingua di sistema)',
        settingsTranslationHelp: 'Errore di traduzione? Apri una issue o una pull request su GitHub.',
    },
    tr: {
        modalTitle: 'Oturumlar\u0131 y\u00f6net',
        savePlaceholder: 'Yeni oturum ad\u0131...',
        save: 'Olu\u015ftur',
        load: 'Ge\u00e7i\u015f',
        active: 'Active',
        modifiedJustNow: 'Az \u00f6nce de\u011fi\u015ftirildi',
        modifiedMinutes: function (n) { return n + ' dakika \u00f6nce de\u011fi\u015ftirildi'; },
        modifiedHours: function (n) { return n + ' saat \u00f6nce de\u011fi\u015ftirildi'; },
        modifiedDays: function (n) { return n + ' g\u00fcn \u00f6nce de\u011fi\u015ftirildi'; },
        duplicateName: 'Bu adla bir oturum zaten var.',
        emptyName: 'Oturum ad\u0131 bo\u015f b\u0131rak\u0131lamaz.',
        created: function (n) { return '\u201c' + n + '\u201d oturumu olu\u015fturuldu'; },
        deleted: function (n) { return '\u201c' + n + '\u201d oturumu silindi'; },
        loaded: function (n) { return '\u201c' + n + '\u201d oturumuna ge\u00e7ildi'; },
        saved: function (n) { return '\u201c' + n + '\u201d oturumu kaydedildi'; },
        renamed: function (o, n) { return '\u201c' + o + '\u201d, \u201c' + n + '\u201d olarak yeniden adland\u0131r\u0131ld\u0131'; },
        confirmDelete: function (n) { return '\u201c' + n + '\u201d oturumu silinsin mi?'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d etkin oturum. Yine de silinsin mi?'; },
        renameTitle: 'Oturumu yeniden adland\u0131r',
        renamePlaceholder: 'Yeni ad...',
        noSession: 'Oturum yok',
        cannotDeleteDefault: 'Varsay\u0131lan oturum silinemez.',
        confirmBulkDelete: function (n) { return n + ' oturum silinsin mi?'; },
        bulkDeleted: function (n) { return n + ' oturum silindi'; },
        bulkDelete: function (n) { return n + ' oturum sil'; },
        cmdManage: 'Oturumlar\u0131 y\u00f6net',
        cmdCreate: 'Yeni oturum olu\u015ftur',
        cmdRename: 'Ge\u00e7erli oturumu yeniden adland\u0131r',
        cmdDelete: 'Ge\u00e7erli oturumu sil',
        cmdSave: 'Ge\u00e7erli oturumu kaydet',
        deselect: 'Se\u00e7imi kald\u0131r',
        footerSwitch: 'Ge\u00e7i\u015f',
        footerDragReorder: 'S\u0131ralamak i\u00e7in s\u00fcr\u00fckle',
        defaultLabel: '(varsay\u0131lan)',
        rename: 'Yeniden adland\u0131r',
        delete: 'Sil',
        cancel: '\u0130ptal',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return n + '. oturuma ge\u00e7'; },
        cmdPrevious: '\u00d6nceki oturum',
        cmdNext: 'Sonraki oturum',
        footerHotkeyHint: 'Oturumlara numarayla h\u0131zl\u0131ca ge\u00e7mek i\u00e7in k\u0131sayol atay\u0131n.',
        backupRestored: 'Workspace++: Oturumlar yedekten geri y\u00fcklendi.',
        settingsLanguage: 'Dil',
        settingsLanguageDesc: 'Eklenti aray\u00fcz dili. Komut adlar\u0131na uygulamak i\u00e7in Obsidian\'\u0131 yeniden ba\u015flat\u0131n.',
        settingsLangAuto: 'Otomatik (sistem dili)',
        settingsTranslationHelp: '\u00c7eviri hatas\u0131 m\u0131 buldunuz? GitHub\'da issue veya pull request a\u00e7\u0131n.',
    },
    ar: {
        modalTitle: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a',
        savePlaceholder: '\u0627\u0633\u0645 \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629...',
        save: '\u0625\u0646\u0634\u0627\u0621',
        load: '\u062a\u0628\u062f\u064a\u0644',
        active: 'Active',
        modifiedJustNow: '\u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0644\u0644\u062a\u0648',
        modifiedMinutes: function (n) { return '\u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0646\u0630 ' + arPlural(n, '\u062f\u0642\u064a\u0642\u0629', '\u062f\u0642\u064a\u0642\u062a\u064a\u0646', '\u062f\u0642\u0627\u0626\u0642', '\u062f\u0642\u064a\u0642\u0629'); },
        modifiedHours: function (n) { return '\u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0646\u0630 ' + arPlural(n, '\u0633\u0627\u0639\u0629', '\u0633\u0627\u0639\u062a\u064a\u0646', '\u0633\u0627\u0639\u0627\u062a', '\u0633\u0627\u0639\u0629'); },
        modifiedDays: function (n) { return '\u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0646\u0630 ' + arPlural(n, '\u064a\u0648\u0645', '\u064a\u0648\u0645\u064a\u0646', '\u0623\u064a\u0627\u0645', '\u064a\u0648\u0645'); },
        duplicateName: '\u062a\u0648\u062c\u062f \u062c\u0644\u0633\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0641\u0639\u0644.',
        emptyName: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0627\u0633\u0645 \u0627\u0644\u062c\u0644\u0633\u0629 \u0641\u0627\u0631\u063a\u064b\u0627.',
        created: function (n) { return '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062c\u0644\u0633\u0629 \u201c' + n + '\u201d'; },
        deleted: function (n) { return '\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u062c\u0644\u0633\u0629 \u201c' + n + '\u201d'; },
        loaded: function (n) { return '\u062a\u0645 \u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u201c' + n + '\u201d'; },
        saved: function (n) { return '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062c\u0644\u0633\u0629 \u201c' + n + '\u201d'; },
        renamed: function (o, n) { return '\u062a\u0645\u062a \u0625\u0639\u0627\u062f\u0629 \u062a\u0633\u0645\u064a\u0629 \u201c' + o + '\u201d \u0625\u0644\u0649 \u201c' + n + '\u201d'; },
        confirmDelete: function (n) { return '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u062c\u0644\u0633\u0629 \u201c' + n + '\u201d\u061f'; },
        confirmDeleteActive: function (n) { return '\u201c' + n + '\u201d \u0647\u064a \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629. \u0647\u0644 \u062a\u0631\u064a\u062f \u0627\u0644\u062d\u0630\u0641 \u0639\u0644\u0649 \u0623\u064a \u062d\u0627\u0644\u061f'; },
        renameTitle: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0633\u0645\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0629',
        renamePlaceholder: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062c\u062f\u064a\u062f...',
        noSession: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0644\u0633\u0627\u062a',
        cannotDeleteDefault: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u062d\u0630\u0641 \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629.',
        confirmBulkDelete: function (n) { return '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 ' + arPlural(n, '\u062c\u0644\u0633\u0629 \u0648\u0627\u062d\u062f\u0629', '\u062c\u0644\u0633\u062a\u064a\u0646', '\u062c\u0644\u0633\u0627\u062a', '\u062c\u0644\u0633\u0629') + '\u061f'; },
        bulkDeleted: function (n) { return '\u062a\u0645 \u062d\u0630\u0641 ' + arPlural(n, '\u062c\u0644\u0633\u0629 \u0648\u0627\u062d\u062f\u0629', '\u062c\u0644\u0633\u062a\u064a\u0646', '\u062c\u0644\u0633\u0627\u062a', '\u062c\u0644\u0633\u0629'); },
        bulkDelete: function (n) { return '\u062d\u0630\u0641 ' + arPlural(n, '\u062c\u0644\u0633\u0629 \u0648\u0627\u062d\u062f\u0629', '\u062c\u0644\u0633\u062a\u064a\u0646', '\u062c\u0644\u0633\u0627\u062a', '\u062c\u0644\u0633\u0629'); },
        cmdManage: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a',
        cmdCreate: '\u0625\u0646\u0634\u0627\u0621 \u062c\u0644\u0633\u0629 \u062c\u062f\u064a\u062f\u0629',
        cmdRename: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0633\u0645\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
        cmdDelete: '\u062d\u0630\u0641 \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
        cmdSave: '\u062d\u0641\u0638 \u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
        deselect: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062d\u062f\u064a\u062f',
        footerSwitch: '\u062a\u0628\u062f\u064a\u0644',
        footerDragReorder: '\u0627\u0633\u062d\u0628 \u0644\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0631\u062a\u064a\u0628',
        defaultLabel: '(\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629)',
        rename: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0633\u0645\u064a\u0629',
        delete: '\u062d\u0630\u0641',
        cancel: '\u0625\u0644\u063a\u0627\u0621',
        ribbonTooltip: 'Workspace++',
        cmdSwitchTo: function (n) { return '\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u062c\u0644\u0633\u0629 ' + n; },
        cmdPrevious: '\u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
        cmdNext: '\u0627\u0644\u062c\u0644\u0633\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629',
        footerHotkeyHint: '\u0639\u064a\u0651\u0646 \u0627\u062e\u062a\u0635\u0627\u0631\u0627\u062a \u0644\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0627\u0644\u0633\u0631\u064a\u0639 \u0625\u0644\u0649 \u0627\u0644\u062c\u0644\u0633\u0627\u062a \u0628\u0627\u0644\u0631\u0642\u0645.',
        backupRestored: 'Workspace++: \u062a\u0645\u062a \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a \u0645\u0646 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629.',
        settingsLanguage: '\u0627\u0644\u0644\u063a\u0629',
        settingsLanguageDesc: '\u0644\u063a\u0629 \u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u0629. \u0623\u0639\u062f \u062a\u0634\u063a\u064a\u0644 Obsidian \u0644\u062a\u0637\u0628\u064a\u0642 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0623\u0648\u0627\u0645\u0631.',
        settingsLangAuto: '\u062a\u0644\u0642\u0627\u0626\u064a (\u0644\u063a\u0629 \u0627\u0644\u0646\u0638\u0627\u0645)',
        settingsTranslationHelp: '\u0648\u062c\u062f\u062a \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062a\u0631\u062c\u0645\u0629\u061f \u064a\u0631\u062c\u0649 \u0641\u062a\u062d issue \u0623\u0648 pull request \u0639\u0644\u0649 GitHub.',
    },
};

// Locale resolver (called on load and when settings change)
var L;
function resolveLocale(override) {
    var lang = override && override !== 'auto' ? override : (navigator.language || '');
    var key = lang.slice(0, 2);
    if (key === 'zh') {
        key = /TW|HK|Hant/i.test(lang) ? 'zh-TW' : 'zh';
    }
    L = STRINGS[key] || STRINGS.en;
    if (L !== STRINGS.en) {
        var keys = Object.keys(STRINGS.en);
        for (var i = 0; i < keys.length; i++) {
            if (L[keys[i]] === undefined) L[keys[i]] = STRINGS.en[keys[i]];
        }
    }
}
resolveLocale();

// ============================================================
// Utilities
// ============================================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

function formatRelativeTime(timestamp) {
    var diff = Date.now() - timestamp;
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);

    if (minutes < 1) return L.modifiedJustNow;
    if (minutes < 60) return L.modifiedMinutes(minutes);
    if (hours < 24) return L.modifiedHours(hours);
    return L.modifiedDays(days);
}

// ============================================================
// Session Manager Modal
// ============================================================
var SessionManagerModal = /** @class */ (function (_super) {
    // Inherit from Modal
    function SessionManagerModal(app, plugin) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        return _this;
    }

    // Prototype chain
    SessionManagerModal.prototype = Object.create(_super.prototype);
    SessionManagerModal.prototype.constructor = SessionManagerModal;

    SessionManagerModal.prototype.onOpen = function () {
        var contentEl = this.contentEl;
        contentEl.empty();
        contentEl.addClass('wpp-modal');

        this.titleEl.setText(L.modalTitle);

        // Save section
        var saveContainer = contentEl.createDiv({ cls: 'wpp-save-container' });
        this.nameInput = saveContainer.createEl('input', {
            type: 'text',
            placeholder: L.savePlaceholder,
            cls: 'wpp-save-input',
        });
        var saveBtn = saveContainer.createEl('button', {
            text: L.save,
            cls: 'wpp-save-btn',
        });

        var self = this;
        saveBtn.addEventListener('click', function () { self.onSave(); });
        this.nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') self.onSave();
        });

        // Focus & selection state
        this.focusedIndex = -1;
        this.focusedButtonIndex = -1;
        this.selectedIds = new Set();

        // Bulk actions bar
        this.bulkActionsEl = contentEl.createDiv({ cls: 'wpp-bulk-actions' });
        this.bulkActionsEl.style.display = 'none';
        this.bulkDeleteBtn = this.bulkActionsEl.createEl('button', { cls: 'mod-warning' });
        this.bulkDeleteBtn.addEventListener('click', function () { self.onBulkDelete(); });
        var deselectBtn = this.bulkActionsEl.createEl('button', { text: L.deselect, cls: 'wpp-deselect-btn' });
        deselectBtn.addEventListener('click', function () {
            self.selectedIds.clear();
            self.updateSelectionUI();
        });

        // Session list
        this.listEl = contentEl.createDiv({ cls: 'wpp-session-list' });
        this.renderList();

        // Set initial focus to active session
        var ordered = this.plugin.getOrderedSessions();
        for (var fi = 0; fi < ordered.length; fi++) {
            if (ordered[fi].id === this.plugin.data.activeSessionId) {
                this.focusedIndex = fi;
                break;
            }
        }
        this.updateFocusUI();

        // Hotkey footer
        var nextKey = this.plugin.getCommandHotkey('next-session');
        var footer = contentEl.createDiv({ cls: 'wpp-modal-footer' });
        if (nextKey) {
            footer.createDiv({ text: L.cmdNext + '  ' + nextKey });
        }
        footer.createDiv({ text: L.footerDragReorder });
        footer.createDiv({ text: L.footerHotkeyHint });

        // Keyboard handler
        this.modalKeyHandler = function (e) {
            // Skip if a confirm/rename modal is open on top
            if (document.querySelector('.wpp-confirm-buttons')) return;

            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var modKey = isMac ? e.metaKey : e.ctrlKey;

            // Mod+Shift+Enter (cycle next session)
            if (modKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                var ordered = self.plugin.getOrderedSessions();
                if (ordered.length <= 1) return;
                var currentIndex = -1;
                for (var i = 0; i < ordered.length; i++) {
                    if (ordered[i].id === self.plugin.data.activeSessionId) {
                        currentIndex = i;
                        break;
                    }
                }
                if (currentIndex === -1) return;
                var next = (currentIndex + 1 + ordered.length) % ordered.length;
                self.plugin.switchSession(ordered[next].id, { silent: true }).then(function () {
                    self.renderList();
                });
                return;
            }

            // Arrow keys — navigate focus (up/down only)
            // Works even when input is focused
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                var dir = e.key === 'ArrowUp' ? -1 : 1;
                self.moveFocus(dir);
                return;
            }

            // Skip remaining keys if input is focused
            if (document.activeElement === self.nameInput) return;

            // ArrowLeft / ArrowRight — navigate action buttons in focused row
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                if (self.focusedIndex < 0) return;
                e.preventDefault();
                var buttons = self.getActionButtons();
                if (buttons.length === 0) return;
                if (e.key === 'ArrowRight') {
                    if (self.focusedButtonIndex < buttons.length - 1) {
                        self.focusedButtonIndex++;
                    }
                } else {
                    if (self.focusedButtonIndex > 0) {
                        self.focusedButtonIndex--;
                    } else {
                        self.focusedButtonIndex = -1;
                    }
                }
                self.updateButtonFocusUI();
                return;
            }

            // Enter — activate focused button, or switch to focused session
            if (e.key === 'Enter') {
                e.preventDefault();
                if (self.focusedButtonIndex >= 0) {
                    var buttons = self.getActionButtons();
                    if (buttons[self.focusedButtonIndex]) {
                        buttons[self.focusedButtonIndex].click();
                    }
                    return;
                }
                self.onFocusedLoad();
                return;
            }

            // Delete / Backspace — delete focused or selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                self.onKeyDelete();
                return;
            }
        };
        document.addEventListener('keydown', this.modalKeyHandler, true);
    };

    SessionManagerModal.prototype.renderList = function () {
        this.listEl.empty();
        var sessions = this.plugin.getOrderedSessions();
        for (var i = 0; i < sessions.length; i++) {
            this.renderSessionItem(sessions[i], i);
        }
        this.setupDragAndDrop();

        // Clamp focus index
        if (this.focusedIndex >= sessions.length) {
            this.focusedIndex = sessions.length - 1;
        }
        // Clean up stale selections
        var validIds = {};
        sessions.forEach(function (s) { validIds[s.id] = true; });
        var self = this;
        this.selectedIds.forEach(function (id) {
            if (!validIds[id]) self.selectedIds.delete(id);
        });
        this.updateFocusUI();
        this.updateSelectionUI();
    };

    SessionManagerModal.prototype.renderSessionItem = function (session, index) {
        var isActive = session.id === this.plugin.data.activeSessionId;
        var self = this;

        var item = this.listEl.createDiv({ cls: 'wpp-session-item' });
        item.dataset.sessionId = session.id;

        // Click handler for focus / Cmd+Click selection
        item.addEventListener('click', function (e) {
            // Always move focus to clicked item
            self.focusedIndex = index;
            self.focusedButtonIndex = -1;
            self.updateButtonFocusUI();
            self.updateFocusUI();

            if (e.target.closest('button, .wpp-icon-btn')) return;
            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var cmdKey = isMac ? e.metaKey : e.ctrlKey;
            if (cmdKey && !session.isDefault) {
                // Cmd+Click: toggle selection
                if (self.selectedIds.has(session.id)) {
                    self.selectedIds.delete(session.id);
                } else {
                    self.selectedIds.add(session.id);
                }
                self.updateSelectionUI();
            } else if (!cmdKey) {
                // Normal click: move focus only
                self.selectedIds.clear();
                self.updateSelectionUI();
            }
        });

        // Hotkey hint
        var hk = index <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (index + 1)) : '';
        item.createSpan({ text: hk || String(index + 1), cls: 'wpp-session-index' });

        // Info section
        var info = item.createDiv({ cls: 'wpp-session-info' });
        var nameRow = info.createDiv({ cls: 'wpp-session-name-row' });
        nameRow.createSpan({ text: session.name, cls: 'wpp-session-name' });
        if (session.isDefault && session.name !== 'default') {
            nameRow.createSpan({ text: L.defaultLabel, cls: 'wpp-default-label' });
        }
        if (isActive) {
            nameRow.createSpan({ text: L.active, cls: 'wpp-active-badge' });
        }
        info.createDiv({ text: formatRelativeTime(session.modified), cls: 'wpp-session-modified' });

        // Action buttons
        var actions = item.createDiv({ cls: 'wpp-session-actions' });

        var loadBtn = actions.createEl('button', { text: L.load, cls: 'wpp-load-btn' });
        loadBtn.addEventListener('click', function () { self.onLoad(session.id); });

        // Rename button
        var renameBtn = actions.createDiv({ cls: 'wpp-icon-btn', attr: { 'aria-label': L.rename } });
        obsidian.setIcon(renameBtn, 'pencil');
        renameBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.onRename(session);
        });

        // Delete button (not for default)
        if (!session.isDefault) {
            var deleteBtn = actions.createDiv({ cls: 'wpp-icon-btn', attr: { 'aria-label': L.delete } });
            obsidian.setIcon(deleteBtn, 'x');
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self.onDelete(session);
            });
        }
    };

    SessionManagerModal.prototype.setupDragAndDrop = function () {
        var self = this;

        this.listEl.querySelectorAll('.wpp-session-item').forEach(function (item) {
            item.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                if (e.target.closest('button, input, .wpp-icon-btn')) return;
                var isMac = navigator.platform.indexOf('Mac') !== -1;
                if (isMac ? e.metaKey : e.ctrlKey) return;

                var startX = e.clientX;
                var startY = e.clientY;
                var dragStarted = false;
                var draggedEl = item;
                var cloneEl = null;

                function startDrag(ev) {
                    dragStarted = true;
                    var rect = item.getBoundingClientRect();
                    var offsetX = startX - rect.left;
                    var offsetY = startY - rect.top;

                    cloneEl = item.cloneNode(true);
                    cloneEl.classList.add('wpp-drag-clone');
                    cloneEl.style.position = 'fixed';
                    cloneEl.style.width = rect.width + 'px';
                    cloneEl.style.top = (ev.clientY - offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - offsetX) + 'px';
                    cloneEl.style.zIndex = '10000';
                    cloneEl.style.pointerEvents = 'none';
                    document.body.appendChild(cloneEl);

                    item.classList.add('is-dragging');

                    // Store offset for move handler
                    cloneEl._offsetX = offsetX;
                    cloneEl._offsetY = offsetY;
                }

                function onMouseMove(ev) {
                    if (!dragStarted) {
                        var dx = ev.clientX - startX;
                        var dy = ev.clientY - startY;
                        if (Math.abs(dx) + Math.abs(dy) < 5) return;
                        startDrag(ev);
                    }

                    cloneEl.style.top = (ev.clientY - cloneEl._offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - cloneEl._offsetX) + 'px';

                    var siblings = self.listEl.querySelectorAll('.wpp-session-item');
                    var placed = false;
                    for (var i = 0; i < siblings.length; i++) {
                        var el = siblings[i];
                        if (el === draggedEl) continue;
                        var r = el.getBoundingClientRect();
                        if (ev.clientY < r.top + r.height / 2) {
                            self.listEl.insertBefore(draggedEl, el);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        self.listEl.appendChild(draggedEl);
                    }
                }

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    if (!dragStarted) return;

                    cloneEl.remove();
                    draggedEl.classList.remove('is-dragging');

                    // Read order from DOM
                    var newOrder = [];
                    var items = self.listEl.querySelectorAll('.wpp-session-item');
                    items.forEach(function (el) {
                        newOrder.push(el.dataset.sessionId);
                    });
                    self.plugin.data.sessionOrder = newOrder;

                    // Update index labels in-place
                    items.forEach(function (el, i) {
                        var indexEl = el.querySelector('.wpp-session-index');
                        if (indexEl) {
                            var hk = i <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (i + 1)) : '';
                            indexEl.textContent = hk || String(i + 1);
                        }
                    });

                    // Highlight moved item
                    draggedEl.classList.add('wpp-just-moved');
                    var movedRef = draggedEl;
                    setTimeout(function () {
                        movedRef.classList.remove('wpp-just-moved');
                    }, 600);

                    self.plugin.persistData();
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    };

    SessionManagerModal.prototype.onSave = function () {
        var self = this;
        var name = this.nameInput.value.trim();
        if (!name) {
            new obsidian.Notice(L.emptyName);
            return;
        }
        // Check duplicate
        var exists = Object.values(this.plugin.data.sessions)
            .some(function (s) { return s.name === name; });
        if (exists) {
            new obsidian.Notice(L.duplicateName);
            return;
        }
        this.plugin.createSession(name).then(function () {
            self.nameInput.value = '';
            self.renderList();
            new obsidian.Notice(L.created(name));
        });
    };

    SessionManagerModal.prototype.onLoad = function (sessionId) {
        if (sessionId === this.plugin.data.activeSessionId) return;
        var self = this;
        this.plugin.switchSession(sessionId).then(function () {
            self.renderList();
        });
    };

    SessionManagerModal.prototype.onRename = function (session) {
        var self = this;
        new RenameModal(this.app, session.name, function (newName) {
            var exists = Object.values(self.plugin.data.sessions)
                .some(function (s) { return s.name === newName && s.id !== session.id; });
            if (exists) {
                new obsidian.Notice(L.duplicateName);
                return;
            }
            var oldName = session.name;
            session.name = newName;
            session.modified = Date.now();
            self.plugin.updateStatusBar();
            self.plugin.persistData().then(function () {
                self.renderList();
                new obsidian.Notice(L.renamed(oldName, newName));
            });
        }).open();
    };

    SessionManagerModal.prototype.onDelete = function (session) {
        var self = this;
        var isActive = session.id === this.plugin.data.activeSessionId;
        var message = isActive
            ? L.confirmDeleteActive(session.name)
            : L.confirmDelete(session.name);

        new ConfirmModal(this.app, message, function () {
            return self.plugin.deleteSession(session.id).then(function (deleted) {
                if (!deleted) return;
                self.renderList();
                new obsidian.Notice(L.deleted(session.name));
            });
        }).open();
    };

    // --- Focus & selection helpers ---

    SessionManagerModal.prototype.moveFocus = function (dir) {
        if (document.activeElement === this.nameInput) {
            this.nameInput.blur();
        }
        var sessions = this.plugin.getOrderedSessions();
        if (sessions.length === 0) return;
        if (this.focusedIndex === -1) {
            this.focusedIndex = dir > 0 ? 0 : sessions.length - 1;
        } else {
            this.focusedIndex = (this.focusedIndex + dir + sessions.length) % sessions.length;
        }
        this.focusedButtonIndex = -1;
        this.updateButtonFocusUI();
        this.updateFocusUI();
    };

    SessionManagerModal.prototype.updateFocusUI = function () {
        var self = this;
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        items.forEach(function (el, i) {
            el.classList.toggle('wpp-focused', i === self.focusedIndex);
        });
        if (this.focusedIndex >= 0 && items[this.focusedIndex]) {
            items[this.focusedIndex].scrollIntoView({ block: 'nearest' });
        }
    };

    SessionManagerModal.prototype.getActionButtons = function () {
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        if (this.focusedIndex < 0 || !items[this.focusedIndex]) return [];
        var actions = items[this.focusedIndex].querySelector('.wpp-session-actions');
        if (!actions) return [];
        return actions.querySelectorAll('button, .wpp-icon-btn');
    };

    SessionManagerModal.prototype.updateButtonFocusUI = function () {
        this.listEl.querySelectorAll('.wpp-session-actions .wpp-btn-focused').forEach(function (el) {
            el.classList.remove('wpp-btn-focused');
        });
        var buttons = this.getActionButtons();
        if (this.focusedButtonIndex >= 0 && this.focusedButtonIndex < buttons.length) {
            buttons[this.focusedButtonIndex].classList.add('wpp-btn-focused');
        }
    };

    SessionManagerModal.prototype.updateSelectionUI = function () {
        var self = this;
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        items.forEach(function (el) {
            el.classList.toggle('wpp-selected', self.selectedIds.has(el.dataset.sessionId));
        });
        this.updateBulkActions();
    };

    SessionManagerModal.prototype.updateBulkActions = function () {
        if (this.selectedIds.size > 0) {
            this.bulkActionsEl.style.display = '';
            this.bulkDeleteBtn.textContent = L.bulkDelete(this.selectedIds.size);
        } else {
            this.bulkActionsEl.style.display = 'none';
        }
    };

    SessionManagerModal.prototype.onFocusedLoad = function () {
        var sessions = this.plugin.getOrderedSessions();
        if (this.focusedIndex < 0 || this.focusedIndex >= sessions.length) return;
        this.onLoad(sessions[this.focusedIndex].id);
    };

    SessionManagerModal.prototype.onKeyDelete = function () {
        if (this.selectedIds.size > 0) {
            this.onBulkDelete();
        } else {
            var sessions = this.plugin.getOrderedSessions();
            if (this.focusedIndex < 0 || this.focusedIndex >= sessions.length) return;
            var session = sessions[this.focusedIndex];
            if (session.isDefault) {
                new obsidian.Notice(L.cannotDeleteDefault);
                return;
            }
            this.onDelete(session);
        }
    };

    SessionManagerModal.prototype.onBulkDelete = function () {
        var self = this;
        var ids = [];
        this.selectedIds.forEach(function (id) { ids.push(id); });
        var count = ids.length;

        new ConfirmModal(this.app, L.confirmBulkDelete(count), function () {
            var promises = ids.map(function (id) {
                return self.plugin.deleteSession(id);
            });
            return Promise.all(promises).then(function (results) {
                var deletedCount = results.filter(function (d) { return d; }).length;
                self.selectedIds.clear();
                self.renderList();
                if (deletedCount > 0) {
                    new obsidian.Notice(L.bulkDeleted(deletedCount));
                }
            });
        }).open();
    };

    SessionManagerModal.prototype.onClose = function () {
        if (this.modalKeyHandler) {
            document.removeEventListener('keydown', this.modalKeyHandler, true);
            this.modalKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return SessionManagerModal;
})(obsidian.Modal);

// ============================================================
// Confirm Modal
// ============================================================
var ConfirmModal = /** @class */ (function (_super) {
    function ConfirmModal(app, message, onConfirm) {
        var _this = _super.call(this, app) || this;
        _this.message = message;
        _this.onConfirm = onConfirm;
        return _this;
    }

    ConfirmModal.prototype = Object.create(_super.prototype);
    ConfirmModal.prototype.constructor = ConfirmModal;

    ConfirmModal.prototype.onOpen = function () {
        var contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });
        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var self = this;

        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });

        var confirmBtn = btns.createEl('button', { text: L.delete, cls: 'mod-warning' });
        confirmBtn.addEventListener('click', function () {
            self.onConfirm();
            self.close();
        });

        this.buttons = [cancelBtn, confirmBtn];
        this.focusedButtonIndex = 1; // Default focus on Delete
        this.updateButtonFocus();

        // Keyboard handler
        this.confirmKeyHandler = function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                self.focusedButtonIndex = 0;
                self.updateButtonFocus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                self.focusedButtonIndex = 1;
                self.updateButtonFocus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (self.focusedButtonIndex === 0) {
                    self.close();
                } else {
                    self.onConfirm();
                    self.close();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
            }
        };
        document.addEventListener('keydown', this.confirmKeyHandler, true);
    };

    ConfirmModal.prototype.updateButtonFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    ConfirmModal.prototype.onClose = function () {
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler, true);
            this.confirmKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return ConfirmModal;
})(obsidian.Modal);

// ============================================================
// Rename Modal
// ============================================================
var RenameModal = /** @class */ (function (_super) {
    function RenameModal(app, currentName, onRename) {
        var _this = _super.call(this, app) || this;
        _this.currentName = currentName;
        _this.onRename = onRename;
        return _this;
    }

    RenameModal.prototype = Object.create(_super.prototype);
    RenameModal.prototype.constructor = RenameModal;

    RenameModal.prototype.onOpen = function () {
        var contentEl = this.contentEl;
        var self = this;
        this.titleEl.setText(L.renameTitle);

        var input = contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
            placeholder: L.renamePlaceholder,
            cls: 'wpp-rename-input',
        });
        input.select();

        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });
        var renameBtn = btns.createEl('button', { text: L.rename, cls: 'mod-cta' });

        var doRename = function () {
            var newName = input.value.trim();
            if (newName && newName !== self.currentName) {
                self.onRename(newName);
                self.close();
            }
        };

        renameBtn.addEventListener('click', doRename);

        this.buttons = [cancelBtn, renameBtn];
        this.focusedButtonIndex = -1; // -1 = input focused

        this.renameKeyHandler = function (e) {
            if (self.focusedButtonIndex === -1) {
                // Input focused
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    self.focusedButtonIndex = 1;
                    self.updateRenameBtnFocus();
                    input.blur();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    doRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            } else {
                // Button focused
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.focusedButtonIndex = -1;
                    self.updateRenameBtnFocus();
                    input.focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (self.focusedButtonIndex > 0) {
                        self.focusedButtonIndex--;
                    } else {
                        self.focusedButtonIndex = -1;
                        self.updateRenameBtnFocus();
                        input.focus();
                        return;
                    }
                    self.updateRenameBtnFocus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (self.focusedButtonIndex < 1) {
                        self.focusedButtonIndex = 1;
                        self.updateRenameBtnFocus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (self.focusedButtonIndex === 0) {
                        self.close();
                    } else {
                        doRename();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            }
        };
        document.addEventListener('keydown', this.renameKeyHandler, true);

        setTimeout(function () { input.focus(); }, 50);
    };

    RenameModal.prototype.updateRenameBtnFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    RenameModal.prototype.onClose = function () {
        if (this.renameKeyHandler) {
            document.removeEventListener('keydown', this.renameKeyHandler, true);
            this.renameKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return RenameModal;
})(obsidian.Modal);

// ============================================================
// Main Plugin
// ============================================================
var DEFAULT_DATA = {
    activeSessionId: null,
    sessions: {},
    sessionOrder: [],
    language: 'auto',
};

var WorkspacePlusPlus = /** @class */ (function (_super) {
    function WorkspacePlusPlus() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    WorkspacePlusPlus.prototype = Object.create(_super.prototype);
    WorkspacePlusPlus.prototype.constructor = WorkspacePlusPlus;

    WorkspacePlusPlus.prototype.onload = function () {
        var self = this;

        return this.loadWithBackup().then(function (saved) {
            self.data = Object.assign({}, DEFAULT_DATA, saved || {});
            if (!self.data.sessions) self.data.sessions = {};
            if (!self.data.sessionOrder) self.data.sessionOrder = [];
            self.syncSessionOrder();
            resolveLocale(self.data.language);

            // Ribbon icon (left sidebar)
            self.addRibbonIcon('panels-left-bottom', L.ribbonTooltip, function () {
                new SessionManagerModal(self.app, self).open();
            });

            // Status bar
            self.statusBarEl = self.addStatusBarItem();
            self.statusBarEl.addClass('wpp-status-bar');
            self.statusBarEl.addEventListener('click', function () {
                new SessionManagerModal(self.app, self).open();
            });
            self.updateStatusBar();

            // Commands
            self.addCommand({
                id: 'manage-sessions',
                name: L.cmdManage,
                callback: function () {
                    new SessionManagerModal(self.app, self).open();
                },
            });

            self.addCommand({
                id: 'create-session',
                name: L.cmdCreate,
                callback: function () {
                    var modal = new SessionManagerModal(self.app, self);
                    modal.open();
                    setTimeout(function () {
                        if (modal.nameInput) modal.nameInput.focus();
                    }, 100);
                },
            });

            self.addCommand({
                id: 'rename-session',
                name: L.cmdRename,
                callback: function () { self.renameCurrentSession(); },
            });

            self.addCommand({
                id: 'delete-session',
                name: L.cmdDelete,
                callback: function () { self.deleteCurrentSession(); },
            });

            self.addCommand({
                id: 'save-session',
                name: L.cmdSave,
                callback: function () { self.saveCurrentSession(); },
            });

            // Numbered session switching (Mod+Shift+1 through 9)
            for (var n = 1; n <= 9; n++) {
                (function (num) {
                    self.addCommand({
                        id: 'switch-to-' + num,
                        name: L.cmdSwitchTo(num),
                        callback: function () { self.switchToIndex(num - 1); },
                    });
                })(n);
            }

            // Previous / Next session
            self.addCommand({
                id: 'previous-session',
                name: L.cmdPrevious,
                callback: function () { self.switchRelative(-1); },
            });

            self.addCommand({
                id: 'next-session',
                name: L.cmdNext,
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Enter' }],
                callback: function () { self.switchRelative(1); },
            });

            // Settings tab
            self.addSettingTab(new WorkspacePlusPlusSettingTab(self.app, self));

            // Startup: ensure default session exists, then flush
            self.app.workspace.onLayoutReady(function () {
                self.ensureDefaultSession();
                self.flushOnStartup();
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.hideSwitchOverlay();
    };

    // --- Session order ---

    WorkspacePlusPlus.prototype.syncSessionOrder = function () {
        var sessions = this.data.sessions;
        var order = this.data.sessionOrder;
        // Remove IDs no longer in sessions
        this.data.sessionOrder = order.filter(function (id) { return !!sessions[id]; });
        // Find sessions not yet in order
        var inOrder = {};
        for (var i = 0; i < this.data.sessionOrder.length; i++) {
            inOrder[this.data.sessionOrder[i]] = true;
        }
        var missing = Object.keys(sessions).filter(function (id) { return !inOrder[id]; });
        missing.sort(function (a, b) {
            if (sessions[a].isDefault) return -1;
            if (sessions[b].isDefault) return 1;
            return sessions[a].name.localeCompare(sessions[b].name);
        });
        for (var j = 0; j < missing.length; j++) {
            if (sessions[missing[j]].isDefault) {
                this.data.sessionOrder.unshift(missing[j]);
            } else {
                this.data.sessionOrder.push(missing[j]);
            }
        }
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        var sessions = this.data.sessions;
        return this.data.sessionOrder
            .map(function (id) { return sessions[id]; })
            .filter(function (s) { return !!s; });
    };

    WorkspacePlusPlus.prototype.switchToIndex = function (index) {
        var ordered = this.getOrderedSessions();
        if (index >= ordered.length) return;
        if (ordered[index].id === this.data.activeSessionId) {
            this.showSwitchOverlay(ordered, index);
            return;
        }
        this.showSwitchOverlay(ordered, index);
        this.switchSession(ordered[index].id, { silent: true });
    };

    WorkspacePlusPlus.prototype.switchRelative = function (offset) {
        var ordered = this.getOrderedSessions();
        if (ordered.length <= 1) return;
        var currentIndex = -1;
        for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === this.data.activeSessionId) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex === -1) return;
        var next = (currentIndex + offset + ordered.length) % ordered.length;
        this.showSwitchOverlay(ordered, next);
        this.switchSession(ordered[next].id, { silent: true });
    };

    // --- Hotkey helpers ---

    WorkspacePlusPlus.prototype.formatHotkey = function (hotkey) {
        var isMac = navigator.platform.indexOf('Mac') !== -1;
        var parts = [];
        var mods = hotkey.modifiers || [];
        for (var i = 0; i < mods.length; i++) {
            var m = mods[i];
            if (m === 'Mod') parts.push(isMac ? '⌘' : 'Ctrl');
            else if (m === 'Alt') parts.push(isMac ? '⌥' : 'Alt');
            else if (m === 'Shift') parts.push(isMac ? '⇧' : 'Shift');
            else if (m === 'Ctrl') parts.push(isMac ? '⌃' : 'Ctrl');
        }
        var key = hotkey.key;
        if (key === 'ArrowLeft') key = '←';
        else if (key === 'ArrowRight') key = '→';
        else if (key === 'ArrowUp') key = '↑';
        else if (key === 'ArrowDown') key = '↓';

        if (isMac) return parts.join('') + key;
        parts.push(key);
        return parts.join('+');
    };

    WorkspacePlusPlus.prototype.getCommandHotkey = function (cmdId) {
        var fullId = this.manifest.id + ':' + cmdId;
        try {
            var mgr = this.app.hotkeyManager;
            if (!mgr) return '';
            var hotkeys = mgr.getHotkeys ? mgr.getHotkeys(fullId) : null;
            if (!hotkeys || hotkeys.length === 0) {
                hotkeys = mgr.getDefaultHotkeys ? mgr.getDefaultHotkeys(fullId) : null;
            }
            if (!hotkeys || hotkeys.length === 0) return '';
            return this.formatHotkey(hotkeys[0]);
        } catch (e) {
            return '';
        }
    };

    // --- Switch overlay ---

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex) {
        // Remove existing overlay
        if (this.switchOverlayEl) {
            this.switchOverlayEl.remove();
        }
        if (this.switchOverlayTimer) {
            clearTimeout(this.switchOverlayTimer);
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay';

        var list = document.createElement('div');
        list.className = 'wpp-switch-list';

        for (var i = 0; i < ordered.length; i++) {
            var item = document.createElement('div');
            item.className = 'wpp-switch-item';
            if (i === activeIndex) {
                item.classList.add('is-active');
            }

            var name = document.createElement('div');
            name.className = 'wpp-switch-name';
            name.textContent = ordered[i].name;
            item.appendChild(name);

            var hk = i <= 8 ? this.getCommandHotkey('switch-to-' + (i + 1)) : '';
            var hotkeyEl = document.createElement('div');
            hotkeyEl.className = 'wpp-switch-hotkey';
            hotkeyEl.textContent = hk || String(i + 1);
            item.appendChild(hotkeyEl);

            list.appendChild(item);
        }

        overlay.appendChild(list);

        var nextKey = this.getCommandHotkey('next-session');
        if (nextKey) {
            var footer = document.createElement('div');
            footer.className = 'wpp-switch-footer';
            footer.textContent = L.cmdNext + '  ' + nextKey;
            overlay.appendChild(footer);
        }

        document.body.appendChild(overlay);
        this.switchOverlayEl = overlay;

        // Dismiss when modifier keys are released
        var self = this;
        var showTime = Date.now();

        this.overlayKeyUpHandler = function (e) {
            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var modHeld = isMac ? e.metaKey : e.ctrlKey;
            var modShiftHeld = modHeld && e.shiftKey;
            if (!modShiftHeld) {
                // Ensure minimum 300ms visibility
                var elapsed = Date.now() - showTime;
                var minDelay = Math.max(0, 300 - elapsed);
                self.cleanupOverlayListeners();
                if (minDelay > 0) {
                    self.switchOverlayTimer = setTimeout(function () {
                        self.hideSwitchOverlay();
                    }, minDelay);
                } else {
                    self.hideSwitchOverlay();
                }
            }
        };

        this.overlayBlurHandler = function () {
            self.hideSwitchOverlay();
        };

        document.addEventListener('keyup', this.overlayKeyUpHandler);
        window.addEventListener('blur', this.overlayBlurHandler);

        // Safety fallback (e.g. focus lost without blur event)
        this.switchOverlayTimer = setTimeout(function () {
            self.hideSwitchOverlay();
        }, 5000);
    };

    WorkspacePlusPlus.prototype.cleanupOverlayListeners = function () {
        if (this.overlayKeyUpHandler) {
            document.removeEventListener('keyup', this.overlayKeyUpHandler);
            this.overlayKeyUpHandler = null;
        }
        if (this.overlayBlurHandler) {
            window.removeEventListener('blur', this.overlayBlurHandler);
            this.overlayBlurHandler = null;
        }
        if (this.switchOverlayTimer) {
            clearTimeout(this.switchOverlayTimer);
            this.switchOverlayTimer = null;
        }
    };

    WorkspacePlusPlus.prototype.hideSwitchOverlay = function () {
        if (this.switchOverlayEl) {
            this.switchOverlayEl.remove();
            this.switchOverlayEl = null;
        }
        this.cleanupOverlayListeners();
    };

    // --- Data persistence ---

    WorkspacePlusPlus.prototype.getBackupPath = function () {
        return this.manifest.dir + '/data.backup.json';
    };

    WorkspacePlusPlus.prototype.persistData = function () {
        var self = this;
        // Write backup before saving main data
        var json = JSON.stringify(this.data);
        return this.app.vault.adapter.write(this.getBackupPath(), json)
            .then(function () {
                return self.saveData(self.data);
            });
    };

    WorkspacePlusPlus.prototype.loadWithBackup = function () {
        var self = this;
        return this.loadData().then(function (saved) {
            if (saved && saved.sessions && Object.keys(saved.sessions).length > 0) {
                return saved;
            }
            // Main data is empty or corrupt — try backup
            return self.app.vault.adapter.exists(self.getBackupPath())
                .then(function (exists) {
                    if (!exists) return saved;
                    return self.app.vault.adapter.read(self.getBackupPath())
                        .then(function (raw) {
                            try {
                                var backup = JSON.parse(raw);
                                if (backup && backup.sessions && Object.keys(backup.sessions).length > 0) {
                                    new obsidian.Notice(L.backupRestored);
                                    return backup;
                                }
                            } catch (e) { /* corrupt backup, ignore */ }
                            return saved;
                        });
                });
        });
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        if (!this.data.activeSessionId) return null;
        return this.data.sessions[this.data.activeSessionId] || null;
    };

    WorkspacePlusPlus.prototype.updateStatusBar = function () {
        var session = this.getActiveSession();
        this.statusBarEl.empty();
        var icon = this.statusBarEl.createSpan({ cls: 'wpp-status-icon' });
        obsidian.setIcon(icon, 'panels-left-bottom');
        this.statusBarEl.createSpan({
            text: session ? session.name : L.noSession,
            cls: 'wpp-status-name',
        });
    };

    // --- Session operations ---

    WorkspacePlusPlus.prototype.createSession = function (name) {
        var id = generateId();
        var layout = this.app.workspace.getLayout();

        this.data.sessions[id] = {
            id: id,
            name: name,
            modified: Date.now(),
            layout: layout,
        };
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;

        this.updateStatusBar();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        var self = this;
        options = options || {};
        var target = this.data.sessions[targetId];
        if (!target) return Promise.resolve();

        // 1. Save current session state
        var current = this.getActiveSession();
        if (current) {
            current.layout = this.app.workspace.getLayout();
            current.modified = Date.now();
        }

        // 2. Update active
        this.data.activeSessionId = targetId;

        // 3. Apply target layout
        var applyLayout = target.layout
            ? this.app.workspace.changeLayout(target.layout)
            : Promise.resolve();

        return applyLayout.then(function () {
            self.updateStatusBar();
            return self.persistData();
        }).then(function () {
            if (!options.silent) {
                new obsidian.Notice(L.loaded(target.name));
            }
        });
    };

    WorkspacePlusPlus.prototype.deleteSession = function (sessionId) {
        var session = this.data.sessions[sessionId];
        if (!session || session.isDefault) return Promise.resolve(false);

        delete this.data.sessions[sessionId];
        var orderIdx = this.data.sessionOrder.indexOf(sessionId);
        if (orderIdx !== -1) this.data.sessionOrder.splice(orderIdx, 1);
        if (this.data.activeSessionId === sessionId) {
            // Fall back to default session
            var defaultSession = Object.values(this.data.sessions)
                .find(function (s) { return s.isDefault; });
            this.data.activeSessionId = defaultSession ? defaultSession.id : null;
        }
        this.updateStatusBar();
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.renameCurrentSession = function () {
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }

        new RenameModal(this.app, session.name, function (newName) {
            var exists = Object.values(self.data.sessions)
                .some(function (s) { return s.name === newName && s.id !== session.id; });
            if (exists) {
                new obsidian.Notice(L.duplicateName);
                return;
            }
            var oldName = session.name;
            session.name = newName;
            session.modified = Date.now();
            self.updateStatusBar();
            self.persistData().then(function () {
                new obsidian.Notice(L.renamed(oldName, newName));
            });
        }).open();
    };

    WorkspacePlusPlus.prototype.deleteCurrentSession = function () {
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }
        if (session.isDefault) {
            new obsidian.Notice(L.cannotDeleteDefault);
            return;
        }

        new ConfirmModal(this.app, L.confirmDeleteActive(session.name), function () {
            return self.deleteSession(session.id).then(function (deleted) {
                if (!deleted) return;
                new obsidian.Notice(L.deleted(session.name));
            });
        }).open();
    };

    WorkspacePlusPlus.prototype.saveCurrentSession = function () {
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }

        session.layout = this.app.workspace.getLayout();
        session.modified = Date.now();
        var self = this;
        return this.persistData().then(function () {
            new obsidian.Notice(L.saved(session.name));
        });
    };

    WorkspacePlusPlus.prototype.ensureDefaultSession = function () {
        var hasDefault = Object.values(this.data.sessions)
            .some(function (s) { return s.isDefault; });
        if (hasDefault) return;

        var id = generateId();
        this.data.sessions[id] = {
            id: id,
            name: 'default',
            modified: Date.now(),
            layout: this.app.workspace.getLayout(),
            isDefault: true,
        };
        this.data.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.persistData();
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        var session = this.getActiveSession();
        if (!session) return;

        session.layout = this.app.workspace.getLayout();
        session.modified = Date.now();
        return this.persistData();
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

// ============================================================
// Settings Tab
// ============================================================
var LANG_OPTIONS = {
    en: 'English',
    ja: '\u65e5\u672c\u8a9e',
    zh: '\u7b80\u4f53\u4e2d\u6587',
    'zh-TW': '\u7e41\u9ad4\u4e2d\u6587',
    ko: '\ud55c\uad6d\uc5b4',
    fr: 'Fran\u00e7ais',
    es: 'Espa\u00f1ol',
    de: 'Deutsch',
    pt: 'Portugu\u00eas',
    id: 'Bahasa Indonesia',
    ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
    it: 'Italiano',
    tr: 'T\u00fcrk\u00e7e',
    ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
};

var WorkspacePlusPlusSettingTab = /** @class */ (function (_super) {
    function WorkspacePlusPlusSettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }

    WorkspacePlusPlusSettingTab.prototype = Object.create(_super.prototype);
    WorkspacePlusPlusSettingTab.prototype.constructor = WorkspacePlusPlusSettingTab;

    WorkspacePlusPlusSettingTab.prototype.display = function () {
        var self = this;
        var containerEl = this.containerEl;
        containerEl.empty();

        new obsidian.Setting(containerEl)
            .setName(L.settingsLanguage)
            .setDesc(L.settingsLanguageDesc)
            .addDropdown(function (dropdown) {
                dropdown.addOption('auto', L.settingsLangAuto);
                var keys = Object.keys(LANG_OPTIONS);
                for (var i = 0; i < keys.length; i++) {
                    dropdown.addOption(keys[i], LANG_OPTIONS[keys[i]]);
                }
                dropdown.setValue(self.plugin.data.language || 'auto');
                dropdown.onChange(function (value) {
                    self.plugin.data.language = value;
                    resolveLocale(value);
                    self.plugin.persistData();
                    self.display();
                });
            });

        var helpEl = containerEl.createEl('p', { text: L.settingsTranslationHelp });
        helpEl.style.fontSize = '12px';
        helpEl.style.color = 'var(--text-faint)';
        helpEl.style.marginTop = '24px';
    };

    return WorkspacePlusPlusSettingTab;
})(obsidian.PluginSettingTab);

module.exports = WorkspacePlusPlus;

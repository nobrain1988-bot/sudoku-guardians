export const LANGS = ['en', 'ko', 'ja'];

export const TECHNICAL_NAMES = {
  nakedSingle: 'Naked Single',
  hiddenSingle: 'Hidden Single',
  pointing: 'Pointing Pair',
  claiming: 'Box/Line Reduction',
  nakedPair: 'Naked Pair',
  hiddenPair: 'Hidden Pair',
  nakedTriple: 'Naked Triple',
  xWing: 'X-Wing',
};

const list = (arr, sep) => arr.join(sep);

const en = {
  label: 'English',
  ui: {
    tagline: 'The sudoku that teaches you how to solve it',
    dailyChallenge: 'Daily Challenge',
    continueGame: 'Continue',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    paused: 'Paused — tap to resume',
    mistakes: 'Mistakes',
    hintsUsed: 'Coach',
    coach: 'Coach',
    undo: 'Undo',
    erase: 'Erase',
    notes: 'Notes',
    solved: 'Solved!',
    time: 'Time',
    brainScore: 'Brain score',
    playAgain: 'Play again',
    backHome: 'Home',
    sound: 'Sound',
    music: 'Music',
    level: 'Level',
    levelUp: 'Level up!',
    techniques: 'Techniques',
    start: 'Start',
    chooseCompanion: 'Choose your companion',
    companionIntro: 'Pick a legendary creature to raise. It grows every time you solve a puzzle.',
    startWith: 'Raise this one',
    evolved: 'Evolved!',
    companionDone: 'Fully grown',
    pickNext: 'Raise a new companion',
    maxed: 'Legendary — fully grown',
    c_dragon: 'Golden Dragon',
    c_phoenix: 'Phoenix',
    c_tiger: 'White Tiger',
    c_griffin: 'Griffin',
    c_leviathan: 'Leviathan',
    s_1: 'Egg',
    s_2: 'Hatchling',
    s_3: 'Juvenile',
    s_4: 'Adolescent',
    s_5: 'Adult',
    s_6: 'Legendary',
    showWhy: 'Show me why',
    fillItIn: 'Fill it in',
    gotIt: 'Got it',
    noHint: 'Everything on the board is already filled in correctly.',
    checkFirst: 'There is a wrong number on the board. Fix it first and the coach can help.',
    nudgeLead: 'Where to look',
    difficultyOf: (d) => en.ui[d],
    winNote: (score, mistakes) =>
      mistakes === 0 && score >= 85
        ? 'Sharp. Not a single mistake.'
        : score >= 85
          ? 'Fast work. Watch the slips and this gets clean.'
          : score >= 65
            ? 'Solid and steady.'
            : 'Finished. Every solve trains the pattern.',
  },
  unit: (u) => (u.kind === 'box' ? 'the highlighted box' : `${u.kind === 'row' ? 'row' : 'column'} ${u.index + 1}`),
  lineWord: (kind) => (kind === 'row' ? 'rows' : 'columns'),
  names: {
    nakedSingle: 'Last number left',
    hiddenSingle: 'Only one spot',
    pointing: 'Locked inside a box',
    claiming: 'Locked inside a line',
    nakedPair: 'Matching pair',
    hiddenPair: 'Hidden pair',
    nakedTriple: 'Matching triple',
    xWing: 'X-Wing',
  },
  nudge: {
    nakedSingle: () => 'One highlighted cell has only a single number left. Check what its row, column and box already use.',
    hiddenSingle: (s, u) => `Look at ${u}. One number has only one place left to go there.`,
    pointing: (s, u) => `Look at the highlighted box. One number is trapped in a single line inside it.`,
    claiming: (s, u) => `Look at ${u}. One number can only land inside one box there.`,
    nakedPair: (s, u) => `Look at ${u}. Two cells share the exact same two options.`,
    hiddenPair: (s, u) => `Look at ${u}. Two numbers fit in only two cells there.`,
    nakedTriple: (s, u) => `Look at ${u}. Three cells share only three options between them.`,
    xWing: (s, u) => `Two ${en.lineWord(s.unit.kind)} hold one number in the same two positions. Find the rectangle.`,
  },
  body: {
    nakedSingle: (s) =>
      `Every number except ${s.digit} already appears in this cell's row, column or box. So ${s.digit} is the only one that fits.`,
    hiddenSingle: (s, u) =>
      `In ${u}, ${s.digit} is blocked from every other empty cell. The highlighted cell is the only place left, so ${s.digit} goes there.`,
    pointing: (s, u) =>
      `Inside the highlighted box, ${s.digit} can only go in the marked cells — and all of them sit in ${u}. So ${s.digit} is ruled out from the other ${s.eliminations.length} cell(s) of ${u}.`,
    claiming: (s, u) =>
      `In ${u}, ${s.digit} only fits inside the highlighted box. So ${s.digit} is ruled out from the other ${s.eliminations.length} cell(s) of that box.`,
    nakedPair: (s, u) =>
      `These two cells can hold only ${list(s.digits, ' and ')}. Between them they use up both numbers, so ${list(s.digits, ' and ')} are ruled out from the rest of ${u}.`,
    hiddenPair: (s, u) =>
      `In ${u}, ${list(s.digits, ' and ')} fit in only these two cells. That means no other number can go in them.`,
    nakedTriple: (s, u) =>
      `These three cells use only ${list(s.digits, ', ')}. They take all three numbers, so those are ruled out from the rest of ${u}.`,
    xWing: (s) =>
      `${s.digit} sits at the four marked corners. In each of those two ${en.lineWord(s.unit.kind)}, ${s.digit} must take one corner — so it is ruled out everywhere else in the two crossing lines.`,
  },
};

const ko = {
  label: '한국어',
  ui: {
    tagline: '푸는 방법을 알려주는 스도쿠',
    dailyChallenge: '오늘의 문제',
    continueGame: '이어하기',
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
    expert: '전문가',
    paused: '일시정지 — 눌러서 계속',
    mistakes: '실수',
    hintsUsed: '코치',
    coach: '코치',
    undo: '되돌리기',
    erase: '지우기',
    notes: '메모',
    solved: '완성!',
    time: '시간',
    brainScore: '두뇌 점수',
    playAgain: '한 판 더',
    backHome: '처음으로',
    sound: '소리',
    music: '음악',
    level: '레벨',
    levelUp: '레벨 업!',
    techniques: '배운 기술',
    start: '시작하기',
    chooseCompanion: '동료를 고르세요',
    companionIntro: '함께 키울 전설의 동물을 고르세요. 한 판 풀 때마다 같이 자랍니다.',
    startWith: '이 동료 키우기',
    evolved: '진화!',
    companionDone: '다 자랐습니다',
    pickNext: '새 동료 키우기',
    maxed: '전설 — 다 자랐습니다',
    c_dragon: '황금룡',
    c_phoenix: '불사조',
    c_tiger: '백호',
    c_griffin: '그리핀',
    c_leviathan: '해룡',
    s_1: '알',
    s_2: '새끼',
    s_3: '유체',
    s_4: '성장기',
    s_5: '성체',
    s_6: '전설',
    showWhy: '왜 그런지 보기',
    fillItIn: '채우기',
    gotIt: '알겠어요',
    noHint: '지금 채워진 숫자는 모두 맞습니다.',
    checkFirst: '판에 틀린 숫자가 있어요. 먼저 고치면 코치가 도와드릴 수 있습니다.',
    nudgeLead: '여기를 보세요',
    difficultyOf: (d) => ko.ui[d],
    winNote: (score, mistakes) =>
      mistakes === 0 && score >= 85
        ? '깔끔했습니다. 실수 하나 없이 푸셨어요.'
        : score >= 85
          ? '빠르게 푸셨습니다. 실수만 줄이면 완벽해요.'
          : score >= 65
            ? '안정적으로 잘 푸셨습니다.'
            : '완성했습니다. 풀수록 패턴이 눈에 들어옵니다.',
  },
  unit: (u) => (u.kind === 'box' ? '표시된 박스' : `${u.index + 1}번째 ${u.kind === 'row' ? '가로줄' : '세로줄'}`),
  lineWord: (kind) => (kind === 'row' ? '가로줄' : '세로줄'),
  names: {
    nakedSingle: '남은 숫자 하나',
    hiddenSingle: '들어갈 자리 하나',
    pointing: '박스에 갇힌 숫자',
    claiming: '줄에 갇힌 숫자',
    nakedPair: '짝꿍 두 칸',
    hiddenPair: '숨은 짝꿍',
    nakedTriple: '짝꿍 세 칸',
    xWing: 'X-윙',
  },
  nudge: {
    nakedSingle: () => '표시된 칸에 들어갈 수 있는 숫자가 하나뿐입니다. 그 칸의 가로줄·세로줄·박스에 이미 나온 숫자를 세어 보세요.',
    hiddenSingle: (s, u) => `${u}을 보세요. 거기에 들어갈 자리가 한 곳뿐인 숫자가 있습니다.`,
    pointing: () => '표시된 박스를 보세요. 한 숫자가 박스 안에서 한 줄에만 들어갈 수 있습니다.',
    claiming: (s, u) => `${u}을 보세요. 한 숫자가 박스 하나 안에만 들어갈 수 있습니다.`,
    nakedPair: (s, u) => `${u}을 보세요. 후보가 똑같은 두 칸이 있습니다.`,
    hiddenPair: (s, u) => `${u}을 보세요. 두 숫자가 두 칸에만 들어갈 수 있습니다.`,
    nakedTriple: (s, u) => `${u}을 보세요. 세 칸이 세 숫자만 나눠 쓰고 있습니다.`,
    xWing: (s) => `두 ${ko.lineWord(s.unit.kind)}에서 한 숫자가 같은 두 자리에만 들어갑니다. 직사각형을 찾아보세요.`,
  },
  body: {
    nakedSingle: (s) =>
      `이 칸이 속한 가로줄·세로줄·박스에 ${s.digit}을(를) 뺀 나머지 숫자가 모두 나와 있습니다. 그래서 여기에는 ${s.digit}밖에 들어갈 수 없어요.`,
    hiddenSingle: (s, u) =>
      `${u}에서 ${s.digit}은(는) 다른 빈칸에 모두 막혀 있습니다. 들어갈 수 있는 자리가 표시된 칸 하나뿐이라 여기에 ${s.digit}이(가) 들어갑니다.`,
    pointing: (s, u) =>
      `표시된 박스 안에서 ${s.digit}이(가) 들어갈 수 있는 칸은 표시된 곳뿐인데, 그 칸들이 전부 ${u}에 있습니다. 그래서 ${u}의 나머지 ${s.eliminations.length}칸에서는 ${s.digit}을(를) 지울 수 있어요.`,
    claiming: (s, u) =>
      `${u}에서 ${s.digit}이(가) 들어갈 자리가 표시된 박스 안에만 있습니다. 그래서 그 박스의 나머지 ${s.eliminations.length}칸에서는 ${s.digit}을(를) 지울 수 있어요.`,
    nakedPair: (s, u) =>
      `이 두 칸에는 ${list(s.digits, '과(와) ')}만 들어갈 수 있습니다. 두 숫자를 이 두 칸이 나눠 가지므로, ${u}의 나머지 칸에서는 두 숫자를 지울 수 있어요.`,
    hiddenPair: (s, u) =>
      `${u}에서 ${list(s.digits, '과(와) ')}이(가) 들어갈 수 있는 칸이 이 두 칸뿐입니다. 그래서 이 두 칸에는 다른 숫자가 올 수 없어요.`,
    nakedTriple: (s, u) =>
      `이 세 칸은 ${list(s.digits, ', ')} 세 숫자만 나눠 씁니다. 그래서 ${u}의 나머지 칸에서는 그 숫자들을 지울 수 있어요.`,
    xWing: (s) =>
      `${s.digit}이(가) 표시된 네 칸에서 직사각형을 이룹니다. 두 ${ko.lineWord(s.unit.kind)} 각각에서 ${s.digit}은(는) 모서리 둘 중 하나에 들어가야 하므로, 교차하는 두 줄의 나머지 칸에서는 지울 수 있어요.`,
  },
};

const ja = {
  label: '日本語',
  ui: {
    tagline: '解き方を教えてくれる数独',
    dailyChallenge: '今日の問題',
    continueGame: '続きから',
    easy: 'やさしい',
    medium: 'ふつう',
    hard: 'むずかしい',
    expert: '達人',
    paused: '一時停止 — タップで再開',
    mistakes: 'ミス',
    hintsUsed: 'コーチ',
    coach: 'コーチ',
    undo: '戻す',
    erase: '消す',
    notes: 'メモ',
    solved: 'クリア！',
    time: 'タイム',
    brainScore: '脳スコア',
    playAgain: 'もう一度',
    backHome: 'ホーム',
    sound: 'サウンド',
    music: '音楽',
    level: 'レベル',
    levelUp: 'レベルアップ！',
    techniques: '覚えた手筋',
    start: 'はじめる',
    chooseCompanion: '仲間を選ぼう',
    companionIntro: '一緒に育てる伝説の生きものを選んでください。パズルを解くたびに育ちます。',
    startWith: 'この仲間を育てる',
    evolved: '進化！',
    companionDone: '育ちきりました',
    pickNext: '新しい仲間を育てる',
    maxed: '伝説 — 育ちきりました',
    c_dragon: '黄金龍',
    c_phoenix: '不死鳥',
    c_tiger: '白虎',
    c_griffin: 'グリフォン',
    c_leviathan: '海龍',
    s_1: '卵',
    s_2: 'ひな',
    s_3: '幼体',
    s_4: '成長期',
    s_5: '成体',
    s_6: '伝説',
    showWhy: '理由を見る',
    fillItIn: '入れる',
    gotIt: 'わかった',
    noHint: '今入っている数字はすべて正しいです。',
    checkFirst: '盤面に間違った数字があります。直すとコーチが手伝えます。',
    nudgeLead: 'ここを見て',
    difficultyOf: (d) => ja.ui[d],
    winNote: (score, mistakes) =>
      mistakes === 0 && score >= 85
        ? '見事です。ミスなしで解けました。'
        : score >= 85
          ? '速いです。ミスを減らせば完璧です。'
          : score >= 65
            ? '安定した解き方でした。'
            : 'クリアです。解くほどパターンが見えてきます。',
  },
  unit: (u) => (u.kind === 'box' ? 'ハイライトされたブロック' : `${u.index + 1}${u.kind === 'row' ? '行目' : '列目'}`),
  lineWord: (kind) => (kind === 'row' ? '行' : '列'),
  names: {
    nakedSingle: '残りひとつ',
    hiddenSingle: '入る場所はひとつ',
    pointing: 'ブロックに閉じ込め',
    claiming: 'ラインに閉じ込め',
    nakedPair: 'そろったペア',
    hiddenPair: '隠れペア',
    nakedTriple: 'そろったトリプル',
    xWing: 'X-Wing',
  },
  nudge: {
    nakedSingle: () => 'ハイライトされたマスに入る数字はひとつだけです。その行・列・ブロックに出ている数字を数えてみましょう。',
    hiddenSingle: (s, u) => `${u}を見てください。入れる場所がひとつしかない数字があります。`,
    pointing: () => 'ハイライトされたブロックを見てください。ある数字が一列にしか入りません。',
    claiming: (s, u) => `${u}を見てください。ある数字がひとつのブロックにしか入りません。`,
    nakedPair: (s, u) => `${u}を見てください。候補がまったく同じ2マスがあります。`,
    hiddenPair: (s, u) => `${u}を見てください。2つの数字が2マスにしか入りません。`,
    nakedTriple: (s, u) => `${u}を見てください。3マスが3つの数字だけを分け合っています。`,
    xWing: (s) => `2つの${ja.lineWord(s.unit.kind)}で、ある数字が同じ2か所にしか入りません。長方形を探しましょう。`,
  },
  body: {
    nakedSingle: (s) =>
      `このマスの行・列・ブロックに、${s.digit}以外の数字がすべて出ています。だからここには${s.digit}しか入りません。`,
    hiddenSingle: (s, u) =>
      `${u}では、${s.digit}は他の空きマスすべてで塞がれています。残った場所はハイライトのマスだけなので、そこに${s.digit}が入ります。`,
    pointing: (s, u) =>
      `ハイライトされたブロック内で${s.digit}が入れるのは印のマスだけで、それらはすべて${u}にあります。よって${u}の残り${s.eliminations.length}マスから${s.digit}を消せます。`,
    claiming: (s, u) =>
      `${u}で${s.digit}が入れるのはハイライトのブロック内だけです。よってそのブロックの残り${s.eliminations.length}マスから${s.digit}を消せます。`,
    nakedPair: (s, u) =>
      `この2マスには${list(s.digits, 'と')}しか入りません。2つの数字をこの2マスが使い切るので、${u}の残りのマスからは消せます。`,
    hiddenPair: (s, u) => `${u}では${list(s.digits, 'と')}が入るのはこの2マスだけです。よって他の数字は入りません。`,
    nakedTriple: (s, u) =>
      `この3マスは${list(s.digits, '・')}の3つだけを分け合います。よって${u}の残りのマスからはそれらを消せます。`,
    xWing: (s) =>
      `${s.digit}が印の4マスで長方形を作ります。2つの${ja.lineWord(s.unit.kind)}それぞれで${s.digit}は角のどちらかに入るため、交差する2本のライン上の他のマスからは消せます。`,
  },
};

const PACKS = { en, ko, ja };

export const getPack = (lang) => PACKS[lang] ?? en;

export function t(lang, key) {
  const pack = getPack(lang);
  const value = pack.ui[key];
  return typeof value === 'function' ? value : (value ?? en.ui[key] ?? key);
}

export function explain(lang, step) {
  const pack = getPack(lang);
  const unitLabel = step.unit ? pack.unit(step.unit) : '';
  return {
    title: pack.names[step.technique],
    technical: TECHNICAL_NAMES[step.technique],
    nudge: pack.nudge[step.technique](step, unitLabel),
    body: pack.body[step.technique](step, unitLabel),
  };
}

export function detectLang() {
  const saved = localStorage.getItem('sc.lang');
  if (saved && LANGS.includes(saved)) return saved;
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGS.includes(nav) ? nav : 'en';
}

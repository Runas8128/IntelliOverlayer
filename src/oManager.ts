import { CompletionItem, Hover, MarkdownString, Position, TextDocument, workspace } from 'vscode';
import { OClass, OConstructor, OEnum, OEnumMember, OFunction, OObject, OVariable } from './types';

const opt = new OVariable('opt', 'number');
const optStr = new OVariable('opt', 'string');

function isCustomTag() {
  const workspaceFolder = workspace
    .getConfiguration('intellioverlayer')
    .get<string[]>('workspaceFolder');

  return workspaceFolder?.includes(workspace.name ?? '');
}

export default class Manager {
  static list: Array<OObject> = [];

  static async suggest(d: TextDocument, p: Position): Promise<CompletionItem[]> {
    // ignore non-overlayer workspace
    if (!isCustomTag()) { return []; }
  
    const wordProvider = new WordProvider(d, p);
    let target = wordProvider.getWord(/[A-Za-z]+\.?/),
        targetObjs: OObject[];
    if (!target) { return []; }
  
    if (!target.endsWith('.')) {
      // General object completion
      targetObjs = Manager.list
        .filter(obj => obj.name.toLowerCase().includes(target!.toLowerCase()));
    }
    else {
      // Member object completion
      if (target === 'tiles.') { target = 'Tiles.'; }
      const parent = Manager.list.find(obj => obj.name + '.' === target);
  
      targetObjs = parent instanceof OClass
        ? parent.member
        : parent instanceof OEnum
          ? parent.vars
          : []; // if targetObj is none of them, there is no member below it
    }
  
    return targetObjs.map(obj => obj.toCompletionItem({ position: p }));
  }

  static async getHover(d: TextDocument, p: Position): Promise<Hover | undefined> {
    // ignore non-overlayer workspace
    if (!isCustomTag()) { return; }
    
    let parentObj: OObject | undefined, targetObj: OObject | undefined;
    const wordProvider = new WordProvider(d, p);

    const localObj = wordProvider.local;
    if (localObj) {
      // target is Member object
      if (localObj[0] === 'tiles') { localObj[0] = 'Tiles'; }
      parentObj = Manager.find(localObj[0]);
      if (parentObj instanceof OClass) {
        targetObj = parentObj.member.find(obj => obj.name === localObj[1]);
      }
    }
    else {
      // target is Global object
      targetObj = Manager.find(wordProvider.global);
      if (targetObj instanceof OClass && wordProvider.isStrictlyFunc) {
        targetObj = targetObj.member.find(obj => obj instanceof OConstructor);
      }
    }

    if (!targetObj) { return; }

    const text = targetObj.toHoverDesc({ parent: parentObj });
    const mdStr = new MarkdownString();
    mdStr.supportHtml = true;
    mdStr.appendCodeblock(text || '', 'typescript');
    mdStr.appendCodeblock(targetObj?.desc || '', 'typescript');

    return new Hover(mdStr);
  }

  static find = (name?: string) => Manager.list.find(obj => obj.name === name);

  static init() {
    // Judgement / Hit margin
    this.list.push(
      new OFunction('SHit', [], 'string', 'HitMargin in Strict Difficulty'),
      new OFunction('STE', [], 'number', 'TooEarly in Strict Difficulty'),
      new OFunction('SVE', [], 'number', 'VeryEarly in Strict Difficulty'),
      new OFunction('SEP', [], 'number', 'EarlyPerfect in Strict Difficulty'),
      new OFunction('SP', [], 'number', 'Perfect in Strict Difficulty'),
      new OFunction('SLP', [], 'number', 'LatePerfect in Strict Difficulty'),
      new OFunction('SVL', [], 'number', 'VeryLate in Strict Difficulty'),
      new OFunction('STL', [], 'number', 'TooLate in Strict Difficulty'),

      new OFunction('NHit', [], 'string', 'HitMargin in Normal Difficulty'),
      new OFunction('NTE', [], 'number', 'TooEarly in Normal Difficulty'),
      new OFunction('NVE', [], 'number', 'VeryEarly in Normal Difficulty'),
      new OFunction('NEP', [], 'number', 'EarlyPerfect in Normal Difficulty'),
      new OFunction('NP', [], 'number', 'Perfect in Normal Difficulty'),
      new OFunction('NLP', [], 'number', 'LatePerfect in Normal Difficulty'),
      new OFunction('NVL', [], 'number', 'VeryLate in Normal Difficulty'),
      new OFunction('NTL', [], 'number', 'TooLate in Normal Difficulty'),

      new OFunction('LHit', [], 'string', 'HitMargin in Lenient Difficulty'),
      new OFunction('LTE', [], 'number', 'TooEarly in Lenient Difficulty'),
      new OFunction('LVE', [], 'number', 'VeryEarly in Lenient Difficulty'),
      new OFunction('LEP', [], 'number', 'EarlyPerfect in Lenient Difficulty'),
      new OFunction('LP', [], 'number', 'Perfect in Lenient Difficulty'),
      new OFunction('LLP', [], 'number', 'LatePerfect in Lenient Difficulty'),
      new OFunction('LVL', [], 'number', 'VeryLate in Lenient Difficulty'),
      new OFunction('LTL', [], 'number', 'TooLate in Lenient Difficulty'),

      new OFunction('CurHit', [], 'string', 'HitMargin in Current Difficulty'),
      new OFunction('CurTE', [], 'number', 'TooEarly in Current Difficulty'),
      new OFunction('CurVE', [], 'number', 'VeryEarly in Current Difficulty'),
      new OFunction('CurEP', [], 'number', 'EarlyPerfect in Current Difficulty'),
      new OFunction('CurP', [], 'number', 'Perfect in Current Difficulty'),
      new OFunction('CurLP', [], 'number', 'LatePerfect in Current Difficulty'),
      new OFunction('CurVL', [], 'number', 'VeryLate in Current Difficulty'),
      new OFunction('CurTL', [], 'number', 'TooLate in Current Difficulty'),

      new OFunction('FailCount', [], 'number', 'Fail Count'),
      new OFunction('MissCount', [], 'number', 'Miss Count'),
      new OFunction('Overloads', [], 'number', 'Overloads Count'),
      new OFunction('Multipress', [], 'number', 'Multipress Count'),

      new OFunction('KeyJudge', [opt], 'string', 'KeyCode:Judgement'),
    );

    // Hex code
    this.list.push(
      new OFunction('TEHex', [], 'string', 'TooEarly Judgement Hex Code'),
      new OFunction('VEHex', [], 'string', 'VeryEarly Judgement Hex Code'),
      new OFunction('EPHex', [], 'string', 'EarlyPerfect Judgement Hex Code'),
      new OFunction('PHex', [], 'string', 'Perfect Judgement Hex Code'),
      new OFunction('LPHex', [], 'string', 'LatePerfect Judgement Hex Code'),
      new OFunction('VLHex', [], 'string', 'VeryLate Judgement Hex Code'),
      new OFunction('TLHex', [], 'string', 'TooLate Judgement Hex Code'),
      new OFunction('MPHex', [], 'string', 'Multipress Judgement Hex Code'),
      new OFunction('FMHex', [], 'string', 'FailMiss Judgement Hex Code'),
      new OFunction('FOHex', [], 'string', 'FailOverload Judgement Hex Code'),
    );

    // Progress
    this.list.push(
      new OFunction('Progress', [opt], 'number', 'Progress'),
      new OFunction('StartTile', [], 'number', 'Start Tile'),
      new OFunction('LeftTile', [], 'number', 'Left Tile Count'),
      new OFunction('TotalTile', [], 'number', 'Total Tile Count'),
      new OFunction('CurTile', [], 'number', 'Current Tile Count'),
      new OFunction('BestProgress', [opt], 'number', 'Best Progress'),
      new OFunction('LeastCheckPoint', [], 'number', 'Least Check Point Used Count'),
      new OFunction('StartProgress', [opt], 'number', 'Start Progress'),
      new OFunction('ProgressDeath', [opt], 'number', 'Death Count for progress'),
    );

    // Accuracy, Combo, Score
    this.list.push(
      new OFunction('Accuracy', [opt], 'number', 'Accuracy'),
      new OFunction('XAccuracy', [opt], 'number', 'XAccuracy'),
      new OFunction('Timing', [opt], 'number', 'Hit Timing'),
      new OFunction('TimingAvg', [opt], 'number', 'Average Hit Timing'),

      new OFunction('Combo', [], 'number', 'Combo'),
      new OFunction('PlayPoint', [opt], 'number', 'PlayPoint(PP) in adofai.gg'),
      new OFunction('Score', [], 'number', 'Score in Current Difficulty'),
      new OFunction('LScore', [], 'number', 'Score in Lenient Difficulty'),
      new OFunction('NScore', [], 'number', 'Score in Normal Difficulty'),
      new OFunction('SScore', [], 'number', 'Score in Strict Difficulty'),
    );

    // Music / BPM
    this.list.push(
      new OFunction('CurMinute', [], 'number', 'Now Minute of Music'),
      new OFunction('CurSecond', [], 'number', 'Now Second of Music'),
      new OFunction('CurMilliSecond', [], 'number', 'Now MilliSecond of Music'),
      new OFunction('TotalMinute', [], 'number', 'Total Minute of Music'),
      new OFunction('TotalSecond', [], 'number', 'Total Second of Music'),
      new OFunction('TotalMilliSecond', [], 'number', 'Total MilliSecond of Music'),

      new OFunction('Pitch', [opt], 'number', 'Current Pitch'),
      new OFunction('EditorPitch', [opt], 'number', 'Pitch In Editor'),
      new OFunction('CurBpm', [opt], 'number', 'Perceived Bpm'),
      new OFunction('TileBpm', [opt], 'number', 'Tile Bpm'),

      new OFunction('RecKps', [opt], 'number', 'Perceived KPS'),
      new OFunction('CurKps', [], 'number', 'Current KPS'),
    );

    // System time
    this.list.push(
      new OFunction('Year', [], 'number', 'Year of System time'),
      new OFunction('Month', [], 'number', 'Month of System time'),
      new OFunction('Day', [], 'number', 'Day of System time'),
      new OFunction('Hour', [], 'number', 'Hour of System time'),
      new OFunction('Minute', [], 'number', 'Minute of System time'),
      new OFunction('Second', [], 'number', 'Second of System time'),
      new OFunction('MilliSecond', [], 'number', 'MilliSecond of System time'),
    );

    // CPU / Memory / FPS
    this.list.push(
      new OFunction('Fps', [opt], 'number', 'Frame Rate'),
      new OFunction('FrameTime', [opt], 'number', 'FrameTime'),
      new OFunction('ProcessorCount', [], 'number', 'CPU Core Count'),
      new OFunction('MemoryGBytes', [opt], 'number', 'Total Physical Memory Size (GBytes)'),
      new OFunction('CpuUsage', [opt], 'number', 'ADOFAI\'s CPU Usage (%)'),
      new OFunction('TotalCpuUsage', [opt], 'number', 'Total CPU Usage (%)'),
      new OFunction('MemoryUsage', [opt], 'number', 'ADOFAI\'s Memory Usage (%)'),
      new OFunction('TotalMemoryUsage', [opt], 'number', 'Total Memory Usage'),
      new OFunction('MemoryUsageGBytes', [opt], 'number', 'ADOFAI\'s Memory Usage (GBytes)'),
      new OFunction('TotalMemoryUsageGBytes', [opt], 'number', 'Total Memory Usage (GBytes)'),
    );

    // Other Functions
    this.list.push(
      new OFunction('Difficulty', [opt], 'number', 'Difficulty of current level'),
      new OFunction('IntegratedDifficulty', [], 'number', 'Integrated Difficulty'),
      new OFunction('ForumDifficulty', [], 'number', 'Forum Difficulty'),
      new OFunction('PredictedDIfficulty', [], 'number', 'Predicted Difficulty'),

      new OFunction('Radius', [opt], 'number', 'Current Planet\'s Radius'),

      new OFunction('Title', [], 'string', 'Title'),
      new OFunction('Author', [], 'string', 'Author'),
      new OFunction('Artist', [], 'string', 'Artist'),

      new OFunction('CheckPoint', [], 'number', 'Check Point Used Count'),
      new OFunction('CurCheckPoint', [], 'number', 'Current Check Point Index'),
      new OFunction('TotalCheckPoint', [], 'number', 'Total Check Points Count'),

      new OFunction('Attempts', [], 'number', 'Current Level Try Count'),      

      new OFunction('PlayTime', [optStr], 'number', 'PlayTime with Unit received as Option'),
      new OFunction('Expression', [optStr], 'string | number', 'Evaluated Result'),
    );

    // Key codes
    this.list.push(
      new OEnum('KeyCode', [
        new OEnumMember('None', 0),
        new OEnumMember('Backspace', 8),
        new OEnumMember('Delete', 127),
        new OEnumMember('Tab', 9),
        new OEnumMember('Clear', 12),
        new OEnumMember('Return', 13),
        new OEnumMember('Pause', 19),
        new OEnumMember('Escape', 27),
        new OEnumMember('Space', 32),
        new OEnumMember('Keypad0', 256),
        new OEnumMember('Keypad1', 257),
        new OEnumMember('Keypad2', 258),
        new OEnumMember('Keypad3', 259),
        new OEnumMember('Keypad4', 260),
        new OEnumMember('Keypad5', 261),
        new OEnumMember('Keypad6', 262),
        new OEnumMember('Keypad7', 263),
        new OEnumMember('Keypad8', 264),
        new OEnumMember('Keypad9', 265),
        new OEnumMember('KeypadPeriod', 266),
        new OEnumMember('KeypadDivide', 267),
        new OEnumMember('KeypadMultiply', 268),
        new OEnumMember('KeypadMinus', 269),
        new OEnumMember('KeypadPlus', 270),
        new OEnumMember('KeypadEnter', 271),
        new OEnumMember('KeypadEquals', 272),
        new OEnumMember('UpArrow', 273),
        new OEnumMember('DownArrow', 274),
        new OEnumMember('RightArrow', 275),
        new OEnumMember('LeftArrow', 276),
        new OEnumMember('Insert', 277),
        new OEnumMember('Home', 278),
        new OEnumMember('End', 279),
        new OEnumMember('PageUp', 280),
        new OEnumMember('PageDown', 281),
        new OEnumMember('F1', 282),
        new OEnumMember('F2', 283),
        new OEnumMember('F3', 284),
        new OEnumMember('F4', 285),
        new OEnumMember('F5', 286),
        new OEnumMember('F6', 287),
        new OEnumMember('F7', 288),
        new OEnumMember('F8', 289),
        new OEnumMember('F9', 290),
        new OEnumMember('F10', 291),
        new OEnumMember('F11', 292),
        new OEnumMember('F12', 293),
        new OEnumMember('F13', 294),
        new OEnumMember('F14', 295),
        new OEnumMember('F15', 296),
        new OEnumMember('Alpha0', 48),
        new OEnumMember('Alpha1', 49),
        new OEnumMember('Alpha2', 50),
        new OEnumMember('Alpha3', 51),
        new OEnumMember('Alpha4', 52),
        new OEnumMember('Alpha5', 53),
        new OEnumMember('Alpha6', 54),
        new OEnumMember('Alpha7', 55),
        new OEnumMember('Alpha8', 56),
        new OEnumMember('Alpha9', 57),
        new OEnumMember('Exclaim', 33),
        new OEnumMember('DoubleQuote', 34),
        new OEnumMember('Hash', 35),
        new OEnumMember('Dollar', 36),
        new OEnumMember('Percent', 37),
        new OEnumMember('Ampersand', 38),
        new OEnumMember('Quote', 39),
        new OEnumMember('LeftParen', 40),
        new OEnumMember('RightParen', 41),
        new OEnumMember('Asterisk', 42),
        new OEnumMember('Plus', 43),
        new OEnumMember('Comma', 44),
        new OEnumMember('Minus', 45),
        new OEnumMember('Period', 46),
        new OEnumMember('Slash', 47),
        new OEnumMember('Colon', 58),
        new OEnumMember('Semicolon', 59),
        new OEnumMember('Less', 60),
        new OEnumMember('Equals', 61),
        new OEnumMember('Greater', 62),
        new OEnumMember('Question', 63),
        new OEnumMember('At', 64),
        new OEnumMember('LeftBracket', 91),
        new OEnumMember('Backslash', 92),
        new OEnumMember('RightBracket', 93),
        new OEnumMember('Caret', 94),
        new OEnumMember('Underscore', 95),
        new OEnumMember('BackQuote', 96),
        new OEnumMember('A', 97),
        new OEnumMember('B', 98),
        new OEnumMember('C', 99),
        new OEnumMember('D', 100),
        new OEnumMember('E', 101),
        new OEnumMember('F', 102),
        new OEnumMember('G', 103),
        new OEnumMember('H', 104),
        new OEnumMember('I', 105),
        new OEnumMember('J', 106),
        new OEnumMember('K', 107),
        new OEnumMember('L', 108),
        new OEnumMember('M', 109),
        new OEnumMember('N', 110),
        new OEnumMember('O', 111),
        new OEnumMember('P', 112),
        new OEnumMember('Q', 113),
        new OEnumMember('R', 114),
        new OEnumMember('S', 115),
        new OEnumMember('T', 116),
        new OEnumMember('U', 117),
        new OEnumMember('V', 118),
        new OEnumMember('W', 119),
        new OEnumMember('X', 120),
        new OEnumMember('Y', 121),
        new OEnumMember('Z', 122),
        new OEnumMember('LeftCurlyBracket', 123),
        new OEnumMember('Pipe', 124),
        new OEnumMember('RightCurlyBracket', 125),
        new OEnumMember('Tilde', 126),
        new OEnumMember('Numlock', 300),
        new OEnumMember('CapsLock', 301),
        new OEnumMember('ScrollLock', 302),
        new OEnumMember('RightShift', 303),
        new OEnumMember('LeftShift', 304),
        new OEnumMember('RightControl', 305),
        new OEnumMember('LeftControl', 306),
        new OEnumMember('RightAlt', 307),
        new OEnumMember('LeftAlt', 308),
        new OEnumMember('LeftMeta', 310),
        new OEnumMember('LeftCommand', 310),
        new OEnumMember('LeftApple', 310),
        new OEnumMember('LeftWindows', 311),
        new OEnumMember('RightMeta', 309),
        new OEnumMember('RightCommand', 309),
        new OEnumMember('RightApple', 309),
        new OEnumMember('RightWindows', 312),
        new OEnumMember('AltGr', 313),
        new OEnumMember('Help', 315),
        new OEnumMember('Print', 316),
        new OEnumMember('SysReq', 317),
        new OEnumMember('Break', 318),
        new OEnumMember('Menu', 319),
        new OEnumMember('Mouse0', 323),
        new OEnumMember('Mouse1', 324),
        new OEnumMember('Mouse2', 325),
        new OEnumMember('Mouse3', 326),
        new OEnumMember('Mouse4', 327),
        new OEnumMember('Mouse5', 328),
        new OEnumMember('Mouse6', 329),
        new OEnumMember('JoystickButton0', 330),
        new OEnumMember('JoystickButton1', 331),
        new OEnumMember('JoystickButton2', 332),
        new OEnumMember('JoystickButton3', 333),
        new OEnumMember('JoystickButton4', 334),
        new OEnumMember('JoystickButton5', 335),
        new OEnumMember('JoystickButton6', 336),
        new OEnumMember('JoystickButton7', 337),
        new OEnumMember('JoystickButton8', 338),
        new OEnumMember('JoystickButton9', 339),
        new OEnumMember('JoystickButton10', 340),
        new OEnumMember('JoystickButton11', 341),
        new OEnumMember('JoystickButton12', 342),
        new OEnumMember('JoystickButton13', 343),
        new OEnumMember('JoystickButton14', 344),
        new OEnumMember('JoystickButton15', 345),
        new OEnumMember('JoystickButton16', 346),
        new OEnumMember('JoystickButton17', 347),
        new OEnumMember('JoystickButton18', 348),
        new OEnumMember('JoystickButton19', 349),
        new OEnumMember('Joystick1Button0', 350),
        new OEnumMember('Joystick1Button1', 351),
        new OEnumMember('Joystick1Button2', 352),
        new OEnumMember('Joystick1Button3', 353),
        new OEnumMember('Joystick1Button4', 354),
        new OEnumMember('Joystick1Button5', 355),
        new OEnumMember('Joystick1Button6', 356),
        new OEnumMember('Joystick1Button7', 357),
        new OEnumMember('Joystick1Button8', 358),
        new OEnumMember('Joystick1Button9', 359),
        new OEnumMember('Joystick1Button10', 360),
        new OEnumMember('Joystick1Button11', 361),
        new OEnumMember('Joystick1Button12', 362),
        new OEnumMember('Joystick1Button13', 363),
        new OEnumMember('Joystick1Button14', 364),
        new OEnumMember('Joystick1Button15', 365),
        new OEnumMember('Joystick1Button16', 366),
        new OEnumMember('Joystick1Button17', 367),
        new OEnumMember('Joystick1Button18', 368),
        new OEnumMember('Joystick1Button19', 369),
        new OEnumMember('Joystick2Button0', 370),
        new OEnumMember('Joystick2Button1', 371),
        new OEnumMember('Joystick2Button2', 372),
        new OEnumMember('Joystick2Button3', 373),
        new OEnumMember('Joystick2Button4', 374),
        new OEnumMember('Joystick2Button5', 375),
        new OEnumMember('Joystick2Button6', 376),
        new OEnumMember('Joystick2Button7', 377),
        new OEnumMember('Joystick2Button8', 378),
        new OEnumMember('Joystick2Button9', 379),
        new OEnumMember('Joystick2Button10', 380),
        new OEnumMember('Joystick2Button11', 381),
        new OEnumMember('Joystick2Button12', 382),
        new OEnumMember('Joystick2Button13', 383),
        new OEnumMember('Joystick2Button14', 384),
        new OEnumMember('Joystick2Button15', 385),
        new OEnumMember('Joystick2Button16', 386),
        new OEnumMember('Joystick2Button17', 387),
        new OEnumMember('Joystick2Button18', 388),
        new OEnumMember('Joystick2Button19', 389),
        new OEnumMember('Joystick3Button0', 390),
        new OEnumMember('Joystick3Button1', 391),
        new OEnumMember('Joystick3Button2', 392),
        new OEnumMember('Joystick3Button3', 393),
        new OEnumMember('Joystick3Button4', 394),
        new OEnumMember('Joystick3Button5', 395),
        new OEnumMember('Joystick3Button6', 396),
        new OEnumMember('Joystick3Button7', 397),
        new OEnumMember('Joystick3Button8', 398),
        new OEnumMember('Joystick3Button9', 399),
        new OEnumMember('Joystick3Button10', 400),
        new OEnumMember('Joystick3Button11', 401),
        new OEnumMember('Joystick3Button12', 402),
        new OEnumMember('Joystick3Button13', 403),
        new OEnumMember('Joystick3Button14', 404),
        new OEnumMember('Joystick3Button15', 405),
        new OEnumMember('Joystick3Button16', 406),
        new OEnumMember('Joystick3Button17', 407),
        new OEnumMember('Joystick3Button18', 408),
        new OEnumMember('Joystick3Button19', 409),
        new OEnumMember('Joystick4Button0', 410),
        new OEnumMember('Joystick4Button1', 411),
        new OEnumMember('Joystick4Button2', 412),
        new OEnumMember('Joystick4Button3', 413),
        new OEnumMember('Joystick4Button4', 414),
        new OEnumMember('Joystick4Button5', 415),
        new OEnumMember('Joystick4Button6', 416),
        new OEnumMember('Joystick4Button7', 417),
        new OEnumMember('Joystick4Button8', 418),
        new OEnumMember('Joystick4Button9', 419),
        new OEnumMember('Joystick4Button10', 420),
        new OEnumMember('Joystick4Button11', 421),
        new OEnumMember('Joystick4Button12', 422),
        new OEnumMember('Joystick4Button13', 423),
        new OEnumMember('Joystick4Button14', 424),
        new OEnumMember('Joystick4Button15', 425),
        new OEnumMember('Joystick4Button16', 426),
        new OEnumMember('Joystick4Button17', 427),
        new OEnumMember('Joystick4Button18', 428),
        new OEnumMember('Joystick4Button19', 429),
        new OEnumMember('Joystick5Button0', 430),
        new OEnumMember('Joystick5Button1', 431),
        new OEnumMember('Joystick5Button2', 432),
        new OEnumMember('Joystick5Button3', 433),
        new OEnumMember('Joystick5Button4', 434),
        new OEnumMember('Joystick5Button5', 435),
        new OEnumMember('Joystick5Button6', 436),
        new OEnumMember('Joystick5Button7', 437),
        new OEnumMember('Joystick5Button8', 438),
        new OEnumMember('Joystick5Button9', 439),
        new OEnumMember('Joystick5Button10', 440),
        new OEnumMember('Joystick5Button11', 441),
        new OEnumMember('Joystick5Button12', 442),
        new OEnumMember('Joystick5Button13', 443),
        new OEnumMember('Joystick5Button14', 444),
        new OEnumMember('Joystick5Button15', 445),
        new OEnumMember('Joystick5Button16', 446),
        new OEnumMember('Joystick5Button17', 447),
        new OEnumMember('Joystick5Button18', 448),
        new OEnumMember('Joystick5Button19', 449),
        new OEnumMember('Joystick6Button0', 450),
        new OEnumMember('Joystick6Button1', 451),
        new OEnumMember('Joystick6Button2', 452),
        new OEnumMember('Joystick6Button3', 453),
        new OEnumMember('Joystick6Button4', 454),
        new OEnumMember('Joystick6Button5', 455),
        new OEnumMember('Joystick6Button6', 456),
        new OEnumMember('Joystick6Button7', 457),
        new OEnumMember('Joystick6Button8', 458),
        new OEnumMember('Joystick6Button9', 459),
        new OEnumMember('Joystick6Button10', 460),
        new OEnumMember('Joystick6Button11', 461),
        new OEnumMember('Joystick6Button12', 462),
        new OEnumMember('Joystick6Button13', 463),
        new OEnumMember('Joystick6Button14', 464),
        new OEnumMember('Joystick6Button15', 465),
        new OEnumMember('Joystick6Button16', 466),
        new OEnumMember('Joystick6Button17', 467),
        new OEnumMember('Joystick6Button18', 468),
        new OEnumMember('Joystick6Button19', 469),
        new OEnumMember('Joystick7Button0', 470),
        new OEnumMember('Joystick7Button1', 471),
        new OEnumMember('Joystick7Button2', 472),
        new OEnumMember('Joystick7Button3', 473),
        new OEnumMember('Joystick7Button4', 474),
        new OEnumMember('Joystick7Button5', 475),
        new OEnumMember('Joystick7Button6', 476),
        new OEnumMember('Joystick7Button7', 477),
        new OEnumMember('Joystick7Button8', 478),
        new OEnumMember('Joystick7Button9', 479),
        new OEnumMember('Joystick7Button10', 480),
        new OEnumMember('Joystick7Button11', 481),
        new OEnumMember('Joystick7Button12', 482),
        new OEnumMember('Joystick7Button13', 483),
        new OEnumMember('Joystick7Button14', 484),
        new OEnumMember('Joystick7Button15', 485),
        new OEnumMember('Joystick7Button16', 486),
        new OEnumMember('Joystick7Button17', 487),
        new OEnumMember('Joystick7Button18', 488),
        new OEnumMember('Joystick7Button19', 489),
        new OEnumMember('Joystick8Button0', 490),
        new OEnumMember('Joystick8Button1', 491),
        new OEnumMember('Joystick8Button2', 492),
        new OEnumMember('Joystick8Button3', 493),
        new OEnumMember('Joystick8Button4', 494),
        new OEnumMember('Joystick8Button5', 495),
        new OEnumMember('Joystick8Button6', 496),
        new OEnumMember('Joystick8Button7', 497),
        new OEnumMember('Joystick8Button8', 498),
        new OEnumMember('Joystick8Button9', 499),
        new OEnumMember('Joystick8Button10', 500),
        new OEnumMember('Joystick8Button11', 501),
        new OEnumMember('Joystick8Button12', 502),
        new OEnumMember('Joystick8Button13', 503),
        new OEnumMember('Joystick8Button14', 504),
        new OEnumMember('Joystick8Button15', 505),
        new OEnumMember('Joystick8Button16', 506),
        new OEnumMember('Joystick8Button17', 507),
        new OEnumMember('Joystick8Button18', 508),
        new OEnumMember('Joystick8Button19', 509),
      ]),
    );

    // Other Enum
    this.list.push(
      new OEnum('PlanetType', [
        new OEnumMember('Red', 0),
        new OEnumMember('Blue', 1),
        new OEnumMember('Green', 2),
        new OEnumMember('Yellow', 3),
        new OEnumMember('Purple', 4),
        new OEnumMember('Pink', 5),
        new OEnumMember('Orange', 6),
        new OEnumMember('Cyan', 7),
        new OEnumMember('Current', 8),
        new OEnumMember('Other', 9),
      ]),
      new OEnum('Judgement', [
        new OEnumMember('TooEarly', 0),
        new OEnumMember('VeryEarly', 1),
        new OEnumMember('EarlyPerfect', 2),
        new OEnumMember('Perfect', 3),
        new OEnumMember('LatePerfect', 4),
        new OEnumMember('VeryLate', 5),
        new OEnumMember('TooLate', 6),
        new OEnumMember('Multipress', 7),
        new OEnumMember('FailMiss', 8),
        new OEnumMember('FailOverload', 9),
        new OEnumMember('Auto', 10),
      ]),
    );

    // Util class
    this.list.push(
      new OClass('Dictionary', [
        new OFunction('get', [
          new OVariable('key', 'any', 'Key')
        ], 'any'),
        new OFunction('set', [
          new OVariable('key', 'any', 'Key'),
          new OVariable('value', 'any', 'Value')
        ], 'any'),
        new OFunction('clear', [], 'any'),

        new OVariable('count', 'number', 'Element Count'),
      ]),

      new OClass('List', [
        new OFunction('get', [
          new OVariable('index', 'number', 'Index')
        ], 'any'),
        new OFunction('set', [
          new OVariable('index', 'any', 'Index'),
          new OVariable('value', 'any', 'Value')
        ], 'any'),
        new OFunction('clear', [], 'any'),

        new OVariable('count', 'number', 'Element Count'),
      ]),

      new OClass('Vector2', [
        new OConstructor('Vector2', [
          new OVariable('x', 'number'),
          new OVariable('y', 'number'),
        ]),
        new OFunction('normalize', [], 'any'),
      ]),

      new OClass('Vector3', [
        new OConstructor('Vector3', [
          new OVariable('x', 'number'),
          new OVariable('y', 'number'),
        ]),
        new OFunction('normalize', [], 'any'),
      ]),

      new OClass('Color', [
        new OConstructor('Color', [
          new OVariable('r', 'number', 'Red'),
          new OVariable('g', 'number', 'Green'),
          new OVariable('b', 'number', 'Blue'),
          new OVariable('a', 'number', 'Alpha'),
        ]),
      ]),

      new OClass('HSV', [
        new OConstructor('HSV', [
          new OVariable('h', 'number', 'Hue'),
          new OVariable('s', 'number', 'Saturation'),
          new OVariable('v', 'number', 'Value'),
        ]),
      ]),
    );

    // Unity-related class
    this.list.push(
      new OClass('Input', [
        new OFunction('getKeyDown', [
          new OVariable('key', 'number', 'KeyCode')
        ], 'number', 'Is key down'),
        new OFunction('getKeyUp', [
          new OVariable('key', 'number', 'KeyCode')
        ], 'number', 'Is key up'),
        new OFunction('getKey', [
          new OVariable('key', 'number', 'KeyCode')
        ], 'number', 'Is key up or down'),
      ]),

      new OClass('UnityHelper', [
        new OFunction('getComponent', [
          new OVariable('comp', 'Component', 'Component'),
          new OVariable('compType', 'Type', 'Component Type')
        ], 'Component'),
        new OFunction('getComponentInChildren', [
          new OVariable('comp', 'Component', 'Component'),
          new OVariable('compType', 'Type', 'Component Type')
        ], 'Component'),
        new OFunction('addComponent', [
          new OVariable('comp', 'Component', 'Component'),
          new OVariable('compType', 'Type', 'Component Type')
        ], 'Component'),
        new OFunction('type', [
          new OVariable('clrType', 'string', 'CLR Type FullName')
        ], 'any'),
      ]),

      new OClass('Sprite', [
        new OFunction('load', [
          new OVariable('path', 'string', 'Image Path')
        ], 'Sprite'),
      ]),

      new OClass('GameObject', [
        new OConstructor('GameObject', [new OVariable('spr', 'Sprite')]),
        new OFunction('getPosition', [], 'Vector2'),
        new OFunction('setPosition', [new OVariable('vec2', 'Vector2')], 'any'),
        new OFunction('getColor', [], 'Color'),
        new OFunction('setColor', [new OVariable('col', 'Color')], 'any'),
        new OFunction('getSize', [], 'Vector2'),
        new OFunction('setSize', [new OVariable('vec2', 'Vector2')], 'any'),
        new OFunction('getSprite', [], 'Sprite'),
        new OFunction('setSprite', [new OVariable('spr', 'Sprite')], 'any'),
      ]),

      new OClass('Time', [
        new OFunction('getDeltaTime', [], 'number', 'UnityEngine.Time.deltaTime'),
        new OFunction('getFixedTime', [], 'number', 'UnityEngine.Time.fixedTime'),
        new OFunction('getFixedUnscaledDeltaTime', [], 'number', 'UnityEngine.Time.fixedUnscaledDeltaTime'),
        new OFunction('getFixedUnscaledTime', [], 'number', 'UnityEngine.Time.fixedUnscaledTime'),
        new OFunction('getFrameCount', [], 'number', 'UnityEngine.Time.frameCount'),
      ]),
    );

    // ADOFAI-related stuffs
    this.list.push(
      new OVariable('tiles', 'Tiles'),

      new OClass('Tiles', [
        new OFunction('get', [
          new OVariable('index', 'number', 'Index')
        ], 'Tile'),
        new OVariable('count', 'number'),
      ]),

      new OClass('Tile', [
        new OConstructor('Tile', [
          new OVariable('timing', 'number', 'Hit Timing'),
          new OVariable('xAccuracy', 'number', 'XAccuracy'),
          new OVariable('accuracy', 'number', 'Accuracy'),
          new OVariable('judgement', 'number', 'Hit Judgement'),
        ]),
        new OFunction('getSeqID', [], 'number', 'Times Sequence ID'),
        new OFunction('getTiming', [], 'number', 'Hit Timing'),
        new OFunction('getXAccuracy', [], 'number', 'XAccuracy'),
        new OFunction('getAccuracy', [], 'number', 'Accuracy'),
        new OFunction('getJudgement', [], 'number', 'Hit Judgement'),
      ]),

      new OClass('Planet', [
        new OConstructor('Planet', [new OVariable('planetType', 'number', 'PlanetType')]),
        new OFunction('getColor', [], 'Color'),
        new OFunction('setColor', [new OVariable('col', 'Color')], 'any'),
        new OFunction('getSprite', [], 'Sprite'),
        new OFunction('setSprite', [new OVariable('spr', 'Sprite')], 'any'),
        new OFunction('getSpriteSize', [], 'Color'),
        new OFunction('setSpriteSize', [new OVariable('vec2', 'Vector2')], 'any'),
      ]),
    );

    // Overlayer class
    this.list.push(
      new OClass('Overlayer', [
        new OFunction('getCurDir', [], 'string'),
        new OFunction('getModDir', [], 'string'),

        new OFunction('log', [
          new OVariable('obj', 'any', 'Anything')
        ], 'number'),

        new OFunction('hit', [
          new OVariable('func', 'Function', 'Function')
        ], 'number'),
        new OFunction('init', [
          new OVariable('func', 'Function', 'Function')
        ], 'number'),
        new OFunction('openLevel', [
          new OVariable('func', 'Function', 'Function')
        ], 'number'),
        new OFunction('sceneLoad', [
          new OVariable('func', 'Function', 'Function')
        ], 'number'),
        new OFunction('update', [
          new OVariable('func', 'Function', 'Function')
        ], 'number'),

        new OFunction('prefix', [
          new OVariable('target', 'string', 'target; scrController:Awake'),
          new OVariable('func', 'Function', 'Function')
        ], 'boolean'),
        new OFunction('postfix', [
          new OVariable('target', 'string', 'target; scrController:Awake'),
          new OVariable('func', 'Function', 'Function')
        ], 'boolean'),

        new OFunction('calculatePP', [
          new OVariable('difficulty', 'number', 'Difficulty'),
          new OVariable('pitch', 'number', 'Pitch'),
          new OVariable('accuracy', 'number', 'Accuracy'),
          new OVariable('totalTiles', 'number', 'Total Tiles'),
        ], 'number'),

        new OFunction('getGlobalVariable', [
          new OVariable('name', 'string', 'Variable name'),
        ], 'any'),
        new OFunction('setGlobalVariable', [
          new OVariable('name', 'string', 'Variable name'),
          new OVariable('obj', 'any', 'New value'),
        ], 'any'),

        new OFunction('RGBToHSV', [], 'HSV'),
        new OFunction('HSVToRGB', [], 'Color'),

        new OFunction('getPlanet', [
          new OVariable('planetType', 'number', 'Planet Type'),
        ], 'Planet'),

        new OFunction('resolve', [
          new OVariable('clrType', 'string', 'Full CLR Type name'),
        ], 'any'),

        new OFunction('generateProxy', [
          new OVariable('clrType', 'string', 'Full CLR Type name'),
        ], 'any'),

        new OFunction('registerTag', [
          new OVariable('name', 'string', 'Tag name'),
          new OVariable('func', 'Function', 'Function'),
        ], 'any'),
        new OFunction('unregisterTag', [
          new OVariable('name', 'string', 'Tag name'),
        ], 'any'),
      ]),
    );
  }
}

class WordProvider {
  d: TextDocument;
  p: Position;

  constructor(d: TextDocument, p: Position) {
    this.d = d;
    this.p = p;
  }

  getWord(regex?: RegExp): string | undefined {
    const range = this.d.getWordRangeAtPosition(this.p, regex);
    return range ? this.d.getText(range) : undefined;
  }

  get local() {
    let target = this.getWord( /\.[A-Za-z]+/ );
    if (!target) {
      // target is not a member object
      return;
    }

    const full = this.getWord( /[A-Za-z]+.[A-Za-z]+/ );
    if (!full) {
      // cannot find parent object
      return [undefined, target];
    }

    return full.split('.'); // target === _member
  }

  get global() {
    return this.getWord( /[A-Za-z]+/ );
  }

  get isStrictlyFunc() {
    return this.getWord( /[A-Za-z]+\(/ ) !== undefined;
  }
}

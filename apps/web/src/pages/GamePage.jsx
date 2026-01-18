// 导入React的状态管理钩子和副作用钩子
import { useState, useEffect } from 'react';
// 导入语言上下文钩子，用于多语言支持
import { useLanguage } from '../context/LanguageContext';

/**
 * 游戏页面组件
 * 包含五行匹配游戏和AI算命功能
 * 实现了趣味互动和智能分析的结合
 */
function GamePage() {// 函数组件 GamePage，用于渲染游戏页面
  // 从语言上下文获取翻译函数
  const { t } = useLanguage();//const{}是对象解构赋值，将对象的属性赋值给变量，这里的t是一个函数，用于翻译多语言文本

  // 游戏状态管理
  const [gameType, setGameType] = useState('five-elements'); // 当前游戏类型，[]语法是数组解构赋值，将数组的第一个元素赋值给gameType，setGameType是一个函数，用于更新gameType的值
  // 这里的gameType是一个字符串，用于表示当前游戏类型，包括五行匹配游戏和AI算命游戏，默认值为五行匹配游戏
  // useState是React的状态管理钩子，用于在函数组件中添加状态变量，这里的gameType是一个状态变量，用于表示当前游戏类型，包括五行匹配游戏和AI算命游戏，默认值为五行匹配游戏,
  // useState中的'five-elements'是默认值，用于表示五行匹配游戏，当用户选择AI算命游戏时，会将gameType更新为'fortune-telling'
  const [gameStatus, setGameStatus] = useState('menu'); // 游戏状态：menu, playing, finished
  const [score, setScore] = useState(0); // 游戏得分
  const [time, setTime] = useState(60); // 游戏时间（秒）
  const [round, setRound] = useState(1); // 当前回合
  const [maxRounds, setMaxRounds] = useState(10); // 最大回合数
  const [gameData, setGameData] = useState(null); // 游戏数据
  const [selectedAnswer, setSelectedAnswer] = useState(null); // 用户选择的答案
  const [isCorrect, setIsCorrect] = useState(null); // 答案是否正确
  const [showResult, setShowResult] = useState(false); // 是否显示结果


  /**
  *五行数据定义,
  *包含五行元素的颜色、生成元素和征服元素,
  *{}是对象字面量，用于创建对象，这里的对象包含五行元素的颜色、生成元素和征服元素
  */
  const fiveElements = {// 五行元素对象，包含五行元素的颜色、生成元素和征服元素
    '金': { color: '#FFFFFF', generates: '水', conquers: '木' },//color是元素的颜色，generates是元素生成的元素，conquers是元素征服的元素
    '木': { color: '#00FF00', generates: '火', conquers: '土' },//generates不是go语言的关键字，注释一个普通的标识符（key），用于表示元素生成的元素
    '水': { color: '#0000FF', generates: '木', conquers: '火' },
    '火': { color: '#FF0000', generates: '土', conquers: '金' },
    '土': { color: '#FFFF00', generates: '金', conquers: '水' }
  };

  // 游戏类型列表
  const gameTypes = [//[]在这里是初始化了一个数组，数组元素是对象，每个对象包含游戏类型的id、名称和描述
    { id: 'five-elements', name: t('game.fiveElements'), description: t('game.fiveElementsDesc') },// 五行匹配游戏
    { id: 'fortune-telling', name: t('game.fortuneTelling'), description: t('game.fortuneTellingDesc') } // AI算命游戏  
  ];

  /**
   * 生成新的游戏回合
   * 根据当前游戏类型生成相应的游戏数据
   */
  const generateNewRound = () => {// 生成新的游戏回合函数
    if (gameType === 'five-elements') {// 如果游戏类型是五行匹配游戏
      // 生成五行匹配游戏数据
      const elements = Object.keys(fiveElements);// 五行元素数组,Object.keys()方法返回一个数组，数组元素是对象的属性名（键，key）,比如['金','木','水','火','土']
      const element1 = elements[Math.floor(Math.random() * elements.length)];// 随机选择一个元素作为问题元素
      const questionType = Math.random() > 0.5 ? 'generate' : 'conquer';// 随机选择问题类型：生或克，比如水生成木或水克火
      
      let correctAnswer;// 正确答案, let语法是变量声明, 可以在后续代码中赋值
      let question;// 问题描述 ，根据问题类型生成不同的问题描述
      
      if (questionType === 'generate') {// 如果问题类型是生成
        correctAnswer = fiveElements[element1].generates;// 正确答案是元素1生成的元素
        question = t('game.whatGenerates', { element: element1 });// 问题描述：元素1生成什么元素
      } else {
        correctAnswer = fiveElements[element1].conquers;// 正确答案是元素1克的元素
        question = t('game.whatConquers', { element: element1 });// 问题描述：元素1克什么元素     
      }
      
      // 生成选项（包含正确答案和三个错误答案）, 确保选项数组中不包含重复元素
      const options = [correctAnswer];// 选项数组，初始包含正确答案
      while (options.length < 4) {// 循环直到选项数组包含4个元素, 确保选项数组中不包含重复元素
        // 随机选择一个元素,Math.floor()函数返回小于或等于一个给定数字的最大整数, 确保每个元素被随机选择一次
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
             if (!options.includes(randomElement)) {// 如果选项数组中不包含该元素
          options.push(randomElement);// 则将该元素添加到选项数组中
        }
      }
      
      // 打乱选项顺序
      options.sort(() => Math.random() - 0.5);// 随机排序选项数组 
      
      setGameData({// 更新游戏数据状态
        element1,// 问题元素
        questionType,// 问题类型：生成或征服
        correctAnswer,// 正确答案
        question,// 问题描述
        options// 选项数组
      });
    }
  };

  /**
   * 开始游戏
   * 初始化游戏状态，生成第一回合
   */
  const startGame = () => {
    setScore(0);// 初始化得分, 得分初始为0, 每次游戏开始时得分都为0
    setTime(60);// 初始化时间, 时间初始为60秒, 每次游戏开始时时间都为60秒
    setRound(1);// 初始化回合, 回合初始为1, 每次游戏开始时回合都为1 
    setGameStatus('playing');// 设置游戏状态为playing, 每次游戏开始时游戏状态都为playing
    setShowResult(false);// 初始化是否显示结果为false
    generateNewRound();// 生成第一回合，根据当前游戏类型生成相应的游戏数据
  };

  /**
   * 重新开始游戏
   */
  const restartGame = () => {// 重新开始游戏，初始化游戏状态，生成第一回合, const语法是常量声明, 常量的值不能在后续代码中改变
    startGame();// 调用startGame函数，初始化游戏状态，生成第一回合,其中的参数包括得分、时间、回合、游戏状态、是否显示结果、游戏数据，
    // 每次游戏重新开始时，会调用startGame函数，初始化游戏状态，生成第一回合，包括得分、时间、回合、游戏状态、是否显示结果、游戏数据，
    // 确保游戏重新开始时，所有状态都被正确初始化，准备开始新的游戏
  };

  /**
   * 返回游戏菜单
   */
  const returnToMenu = () => {
    setGameStatus('menu');// 设置游戏状态为menu, 每次游戏结束时游戏状态都为menu
    setScore(0);// 初始化得分, 每次游戏结束时得分都为0
    setTime(60);// 初始化时间, 每次游戏结束时时间都为60秒
    setRound(1);// 初始化回合, 每次游戏结束时回合都为1
    setGameData(null);// 初始化游戏数据, 每次游戏结束时游戏数据都为null
    setSelectedAnswer(null);// 初始化用户选择的答案, 每次游戏结束时用户选择的答案都为null
    setIsCorrect(null);// 初始化是否正确, 每次游戏结束时是否正确都为null
    setShowResult(false);// 初始化是否显示结果为false, 每次游戏结束时是否显示结果都为false
  };

  /**
   * 处理用户选择答案
   * @param {string} answer - 用户选择的答案
   */
  const handleAnswerSelect = (answer) => {// 处理用户选择答案函数, 处理用户选择, 包括更新用户选择的答案、判断是否正确、更新得分、显示结果、延迟进入下一回合
    setSelectedAnswer(answer);// 更新用户选择的答案, 每次用户选择答案时, 会更新用户选择的答案, 确保用户能够及时了解自己的选择
    const isAnswerCorrect = answer === gameData.correctAnswer;// 判断用户选择的答案是否正确, 每次用户选择答案时, 会判断用户选择的答案是否与正确答案相等, 确保用户能够及时了解自己的选择是否正确
    setIsCorrect(isAnswerCorrect);// 更新是否正确, 每次用户选择答案时, 会更新是否正确, 确保用户能够及时了解自己的选择是否正确 
    
    // 更新得分
    if (isAnswerCorrect) {// 如果用户选择的答案正确, 则得分加10分, 每次正确答案得分都为10分
      setScore(prevScore => prevScore + 10);// 如果答案正确, 则得分加10分, 每次正确答案得分都为10分
    }
    
    // 显示结果
    setShowResult(true);// 每次用户选择答案后, 都会显示结果, 包括是否正确、得分、时间、回合, 确保用户能够及时了解自己的选择是否正确, 以及当前的得分、时间、回合
    // 延迟进入下一回合
    setTimeout(() => {// 每次用户选择答案后, 会延迟1.5秒进入下一回合, 确保用户能够及时了解自己的选择是否正确, 以及当前的得分、时间、回合
      if (round < maxRounds) {// 如果回合小于最大回合数, 则进入下一回合
        // 进入下一回合
        setRound(prevRound => prevRound + 1);// 回合加1, 每次进入下一回合时回合都加1
        setSelectedAnswer(null);// 初始化用户选择的答案, 每次进入下一回合时用户选择的答案都为null
        setIsCorrect(null);// 初始化是否正确, 每次进入下一回合时是否正确都为null
        setShowResult(false);// 初始化是否显示结果为false, 每次进入下一回合时是否显示结果都为false      
        generateNewRound();// 生成新回合, 根据当前游戏类型生成相应的游戏数据, 确保每次进入下一回合时, 游戏数据都不同, 增加游戏的趣味性和挑战性
      } else {
        // 游戏结束
        setGameStatus('finished');
      }
    }, 1500);// 每次用户选择答案后, 会延迟1.5秒进入下一回合, 确保用户能够及时了解自己的选择是否正确, 以及当前的得分、时间、回合
  };

  /**
   * 游戏计时器
   * 在游戏进行时倒计时
   */
  useEffect(() => {
    let timer;
    if (gameStatus === 'playing' && time > 0) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime - 1);// 每次游戏进行时, 会倒计时1秒, 确保用户能够及时了解自己的选择是否正确, 以及当前的得分、时间、回合
      }, 1000);// 每次游戏进行时, 会倒计时1秒, 确保用户能够及时了解自己的选择是否正确, 以及当前的得分、时间、回合 
    } else if (time === 0) {
      // 时间到，游戏结束
      setGameStatus('finished');
    }
    return () => clearInterval(timer);
  }, [gameStatus, time]);

  /**
   * 渲染游戏菜单
   */
  const renderGameMenu = () => {// 渲染游戏菜单函数, 渲染游戏菜单, 包括游戏标题、游戏描述、游戏类型选择、开始游戏按钮, 确保用户能够及时了解游戏规则、选择游戏类型、开始游戏
    return (
      <div className="game-menu">
        <h2 className="game-title">{t('game.title')}</h2>
        <p className="game-description">{t('game.description')}</p>
        
        <div className="game-types">
          {gameTypes.map(type => (
            <div 
              key={type.id} 
              className={`game-type-card ${gameType === type.id ? 'selected' : ''}`}
              onClick={() => setGameType(type.id)}
            >
              <h3 className="game-type-title">{type.name}</h3>
              <p className="game-type-description">{type.description}</p>
            </div>
          ))}
        </div>
        
        <button 
          className="game-start-button"
          onClick={startGame}
        >
          {t('game.startGame')}
        </button>
      </div>
    );
  };

  /**
   * 渲染五行匹配游戏
   */
  const renderFiveElementsGame = () => {
    if (!gameData) return null;
    
    return (
      <div className="five-elements-game">
        <div className="game-header">
          <div className="game-info">
            <div className="game-score">{t('game.score')}: {score}</div>
            <div className="game-time">{t('game.time')}: {time}</div>
            <div className="game-round">{t('game.round')}: {round}/{maxRounds}</div>
          </div>
          <button 
            className="game-back-button"
            onClick={returnToMenu}
          >
            {t('game.back')}
          </button>
        </div>
        
        <div className="game-content">
          <div className="game-question">
            <div 
              className="element-display"
              style={{ backgroundColor: fiveElements[gameData.element1].color }}
            >
              {gameData.element1}
            </div>
            <div className="question-text">{gameData.question}</div>
          </div>
          
          <div className="game-options">
            {gameData.options.map((option, index) => (
              <div
                key={index}
                className={`game-option ${selectedAnswer === option ? 'selected' : ''} ${showResult ? (option === gameData.correctAnswer ? 'correct' : (selectedAnswer === option ? 'incorrect' : '')) : ''}`}
                style={{ backgroundColor: fiveElements[option].color }}
                onClick={() => !showResult && handleAnswerSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
          
          {showResult && (
            <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? t('game.correct') : t('game.incorrect')}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * 渲染游戏结束页面
   */
  const renderGameFinished = () => {
    return (
      <div className="game-finished">
        <h2 className="game-result-title">{t('game.gameOver')}</h2>
        <div className="game-result">
          <div className="final-score">
            <span className="score-label">{t('game.finalScore')}:</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="final-time">
            <span className="time-label">{t('game.timeRemaining')}:</span>
            <span className="time-value">{time} {t('game.seconds')}</span>
          </div>
          <div className="correct-answers">
            <span className="answers-label">{t('game.correctAnswers')}:</span>
            <span className="answers-value">{Math.floor(score / 10)}/{maxRounds}</span>
          </div>
        </div>
        
        <div className="game-actions">
          <button 
            className="game-restart-button"
            onClick={restartGame}
          >
            {t('game.playAgain')}
          </button>
          <button 
            className="game-menu-button"
            onClick={returnToMenu}
          >
            {t('game.backToMenu')}
          </button>
        </div>
        
        {/* AI算命分析结果 */}
        <div className="fortune-analysis">
          <h3 className="analysis-title">{t('game.fortuneAnalysis')}</h3>
          <div className="analysis-content">
            <p>{t('game.analysisExample1')}</p>
            <p>{t('game.analysisExample2')}</p>
            <p>{t('game.analysisExample3')}</p>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染游戏界面
   */
  const renderGame = () => {
    switch (gameStatus) {
      case 'menu':
        return renderGameMenu();
      case 'playing':
        return renderFiveElementsGame();
      case 'finished':
        return renderGameFinished();
      default:
        return renderGameMenu();
    }
  };

  // 渲染游戏页面
  return (
    <div className="game-page">
      <div className="game-content">
        {renderGame()}
      </div>
    </div>
  );
}

// 导出GamePage组件，供其他组件使用
export default GamePage;

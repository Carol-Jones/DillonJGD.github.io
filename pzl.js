function setup()
{
    setFPS(15);
    canvasSize(960, 1200);
    loadImg(0, "image/pzl/bg.png");
    var BLOCK = ["tako", "wakame", "kurage", "sakana", "uni", "ika"];
    for(var i = 0; i < 6; i++)
    {
        loadImg(1+i, "image/pzl/"+BLOCK[i]+".png");
    }
    loadImg(7, "image/pzl/title.png");
    loadSound(0, "sound/pzl/bgm.m4a");
    loadSound(1, "sound/pzl/se.m4a");
}

var idx = 0;
var tmr = 0;
function mainloop()
{
    tmr++;
    drawPzl();
    drawEffect();
    switch(idx)
    {
        case 0: //タイトル
        drawImgC(7, 480, 400); // タイトルのロゴ
        if(tmr % 40 < 20) fText("TAP TO START", 480, 680, 80, "pink");
        if(key[32] > 0 || tapC > 0)
        {
            clrBlock();
            initVar();
            playBgm(0);
            idx = 1;
            tmr = 0;
        }
        break;

        case 1://ゲームをプレイ
            if(processPzl() == 0)
            {
                stopBgm();
                idx = 2;
                tmr = 0;
            }
            break;
        
        case 2://ゲームオーバー
            fText("GAME OVER", 480, 420, 100, "violet");
            if(tmr > 30 * 5) idx = 0;
            break;
    }
}

// -------------------------------------- Matrices -----------------------------------------------

var masu = new Array(13); //マス目
var kesu = new Array(13); // ブロックを消す判定で使う配列
for(var y = 0; y < 13; y++)
{
    masu[y] = new Array(9);
    kesu[y] = new Array(9);
}

function clrBlock()
{
    var x, y;
    for(y = 0; y <= 12; y++)
    {
        for(x = 0; x<= 8; x++)
        {
            masu[y][x] = -1; //全体を-1で埋める
        }
    }
    for(y = 1; y <= 11; y++)
    {
        for(x = 1; x <= 7; x++)
        {
            masu[y][x] = 0;
            kesu[y][x] = 0;
        }
    }
}

// ------------------------------------------- プレイヤーブロック変数-------------------------------
var block = new Array(6);
//マス目上のブロックの位置を管理する
var myBlockX;
var myBlockY;
var dropSpd;
var blockOffset = 80;
var extend = 0;

// ---------------------------------------- ゲーム変数 ---------------------------------
var gameProc = 0;
var gameTime = 0;
var score = 0;
var hisco = 0;
var rensa = 0; //連鎖回数
var points = 0;
var eftime = 0; //ブロックを消す演出時間

function initVar()
{
    // ブロックの初期位置
    myBlockX = 4; 
    myBlockY = 1;
    dropSpd = 90;

    block[0] = 1;
    block[1] = 2;
    block[2] = 3;

    block[3] = 2;
    block[4] = 3;
    block[5] = 4;

    gameProc = 0;
    gameTime = 30 * 60 * 3; //約３分
    score = 0;
}


function drawPzl()
{
    var c, x, y;
    drawImg(0,0,0);
    for(y = 1; y<= 11; y++)
    {
        for(x = 1; x <= 7; x++)
        {
            if(masu[y][x] > 0) drawImgC(masu[y][x], blockOffset * x, blockOffset * y);
        }
    }
    fTextN("TIME\n" + gameTime, 800, 280, 70, 60, "white"); //fTextN（文字列、X座標、Y座標、文字列を収める高さ、フォントサイズ、いろ）
    fTextN("SCORE\n" + score, 800, 560, 70, 60, "white");
    fTextN("HI-SC\n" + hisco, 800, 840, 70, 60, "white");
    if(gameProc == 0)
    {
        for(x = -1; x <= 1; x++) drawImgC(block[1 + x], blockOffset * (myBlockX + x), blockOffset * myBlockY - 2); //横に3つ並ぶブロックを描く
    }
    if(gameProc == 3)
    {
        fText(points + "pts", 320, 120, 50, RAINBOW[gameTime&8]); //得点を表示
        if(extend > 0) fText("TIME + " + extend + "!", 320, 240, 50, RAINBOW[tmr%8]); //消えたタイム
    }
}


var tapKey = [0, 0, 0, 0]; //ボタンのアイコンをタップしているか
//ブロックを方向キーで動かす関数
function processPzl()
{
    var c, i, n, x ,y;

    if(tapC > 0 && 960 < tapY && tapY < 1200) //タップ操作
    {
        c = int(tapX/240);
        if(0 <= c && c <= 3) tapKey[c]++; //バタンをタップしているならボタンの番後を消さんし変スcに代入。cの値が０〜３ならtapKey[]の値を増やす
    }
    else
    {
        for(i = 0; i < 4; i++) tapKey[i] = 0; //アイコンをタップしていないならtapKey[]の値をクリア
    }

    switch(gameProc)
    {
        case 0: //ブロックの移動
            if(key[37] == 1 || key[37] > 4) //左キー
            {
                key[37]++;
                if(masu[myBlockY][myBlockX - 2] == 0) myBlockX--;
            }
            if(key[39] == 1 || key[39] > 4) //右キー
            {
                key[39]++;
                if(masu[myBlockY][myBlockX + 2] == 0) myBlockX++;
            }
            if(key[32] == 1 || key[32] > 4)
            {
                key[32]++;
                i = block[2];
                block[2] = block[1];
                block[1] = block[0];
                block[0] = i;
            }
            //スマホコントロール
            if(tapKey[0] == 1 || tapKey[0] > 8)
            {
                if(masu[myBlockY][myBlockX - 2] == 0) myBlockX--;
            }
            if(tapKey[2] == 1 || tapKey[2] > 8)
            {
                if(masu[myBlockY][myBlockX + 2] == 0) myBlockX++;
            }
            if(tapKey[3] == 1 || tapKey[3] > 8) // ブロックの入れ替え
            {
                i = block[2];
                block[2] = block[1];
                block[1] = block[0];
                block[0] = i;
            }

            //下に落とす
            if(gameTime % dropSpd == 0 || key[40] > 0 || tapKey[1] > 1)
            {
                if(masu[myBlockY + 1][myBlockX - 1] + masu[myBlockY + 1][myBlockX] + masu[myBlockY + 1][myBlockX + 1] == 0)
                {
                    myBlockY++;
                }
                else // ブロックをマス目上におく
                {
                    masu[myBlockY][myBlockX - 1] = block[0];
                    masu[myBlockY][myBlockX] = block[1];
                    masu[myBlockY][myBlockX + 1] = block[2];
                    rensa = 1; // 連鎖回数を１に
                    gameProc = 1;
                }
            }
            break;

        case 1: //したのますが空いているブロックを落とす
            c = 0;
            for(y = 10; y >= 1; y--) //下から上に向かって調べる
            {
                for(x = 1; x <= 7; x++)
                {
                    if(masu[y][x] > 0 && masu[y+1][x] == 0) // Finds a block that is not contacted below
                    {
                        masu[y+1][x] = masu[y][x];
                        masu[y][x] = 0;
                        c = 1;
                    }
                }
            }
            if(c == 0) gameProc = 2; //全て落としたら次へ
            break;

        case 2: //ブロックが揃ったかの判定
            for(y = 1; y <= 11; y++)
            {
                for(x = 1; x <= 7; x++)
                {
                    c = masu[y][x];
                    if(c > 0)
                    {
                        if(c == masu[y - 1][x] && c == masu[y + 1][x]) //縦に揃っている
                        {
                            kesu[y][x] = 1;
                            kesu[y - 1][x] = 1;
                            kesu[y + 1][x] = 1;
                        }
                        if(c == masu[y][x - 1] && c == masu[y][x + 1]) //横に揃っている
                        {
                            kesu[y][x] = 1;
                            kesu[y][x - 1] = 1;
                            kesu[y][x + 1] = 1;
                        }
                        if(c == masu[y + 1][x - 1] && c == masu[y - 1][x + 1]) // 斜め／に揃っている
                        {
                            kesu[y][x] = 1;
                            kesu[y + 1][x - 1] = 1;
                            kesu[y - 1][x + 1] = 1;
                        }
                        if(c == masu[y + 1][x + 1] && c == masu[y - 1][x - 1]) //斜め\に揃っている
                        {
                            kesu[y][x] = 1;
                            kesu[y + 1][x + 1] = 1;
                            kesu[y - 1][x - 1] = 1;
                        }
                    }
                }
            }
            n = 0; //揃ったっブロックを数える
            for(y = 1; y <= 11; y++)
            {
                for(x = 1; x<= 7; x++)
                {
                    if(kesu[y][x] == 1)
                    {
                        n++;
                        setEffect(blockOffset * x, blockOffset * y); // エフェクト
                    } 
                }
            }
            //揃った場合
            if(n > 0)
            {
                playSE(1);
                if(rensa == 1 && dropSpd > 5) dropSpd--; //消すごとに落下速度が増やす
                points = 50 * n * rensa; // 基本点数は消した数X５０
                score += points;
                if(score > hisco) hisco = score;
                extend = 0;
                if(n % 5 == 0) extend = 300;
                gameTime += extend;
                rensa =  rensa * 2; //連鎖した時、得点が倍々に増える
                eftime = 0;
                gameProc = 3; //消す処理へ
            }
            else
            {
                myBlockX = 4
                myBlockY = 1;
                if(masu[myBlockY][myBlockX - 1] + masu[myBlockY][myBlockX] + masu[myBlockY][myBlockX + 1] > 0) return 0;//ブロックが最上段にある
                block[0] = block[3];
                block[1] = block[4];
                block[2] = block[5];
                c = 4; //ブロックの種類
                if(score > 10000) c = 5;
                if(score > 20000) c = 6;
                block[0] = 1 + rnd(c); //次のブロックのセット
                block[1] = 1 + rnd(c);
                block[2] = 1 + rnd(c);
                gameProc = 0; // 再びブロックの移動へ
                tmr = 0;
            }
            break;

        case 3: //ブロックを消す処理
            eftime++;
            if(eftime == 20)
            {
                for(y = 1; y <= 11; y++)
                {
                    for(x = 1; x <= 7; x++)
                    {
                        if(kesu[y][x] == 1)
                        {
                            kesu[y][x] = 0;
                            masu[y][x] = 0;                    
                        }
                    }
                }
                gameProc = 1; //再び落下処理を行う
            }
            break;
    }
    gameTime--;
    return gameTime;
}

// ------------------ エフェクト -----------------
var RAINBOW = ["#ff0000", "#e08000", "#c0e000", "#00ff00", "#00c0e0", "#0040ff", "#8000e0"];
var EFF_MAX = 100;
var effX = new Array(EFF_MAX);
var effY = new Array(EFF_MAX);
var effT = new Array(EFF_MAX);
var effN = 0;
for(var i = 0; i < EFF_MAX; i++) effT[i] = 0;

function setEffect(x, y) // エフェクトをセット
{
    effX[effN] = x;
    effY[effN] = y;
    effT[effN] = 20;
    effN = (effN + 1) % EFF_MAX;
}

function drawEffect() //エフェクトを描く
{
    lineW(20);
    for(var i = 0; i < EFF_MAX; i++)
    {
        if(effT[i] > 0)
        {
            setAlp(effT[i]*5);
            sCir(effX[i], effY[i], 110 - effT[i] * 5, RAINBOW[(effT[i] + 0) % 8]); // sCir（X座標、Y座標、半径、色）
            sCir(effX[i], effY[i], 90 - effT[i] * 4, RAINBOW[(effT[i] + 1) % 8]);
            sCir(effX[i], effY[i], 70 - effT[i] * 3, RAINBOW[(effT[i] + 2) % 8]);
            effT[i]--;
        }
    }
    setAlp(100);
    lineW(1);
}
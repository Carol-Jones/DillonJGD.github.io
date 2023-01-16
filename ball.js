// -------------------------- ボールの変数 -------------------------
var BALL_MAX = 6;
var ballX = new Array(BALL_MAX);
var ballY = new Array(BALL_MAX);
var ballVx = new Array(BALL_MAX); // ボールのX軸方向の速さ
var ballVy = new Array(BALL_MAX); // ボールのY軸方向の速さ
var life = new Array(BALL_MAX);
var frictionFactor = 0.95;
var hipparuIntensity = 8;
var drag = 0;
var bnum = 0; //　操作するボールの番号
var ally = 0;
var victory = 0;

var BALLX = [350, 450, 550, 850, 750, 650];
var BALLY = [350, 250, 150, 450, 550, 650];
var LIFE = [160, 100, 80, 200, 120, 100];
var POWER = [30, 20, 10, 40, 20, 30];
var CURE = [30, 0, 0, 10, 0, 0]; // 味方を回復させるか
var G_OR_B = [0, 0, 0, 1, 1, 1]; // 0=Girls 1=Boys
var TEAM_COL = ["#ff80c0" , "#40c0ff"];

var cursor = new Array(BALL_MAX);

// ----------------------------- FXの変数 -----------------------
var eff_col = new Array(BALL_MAX); // FX色
var eff_tmr = new Array(BALL_MAX); // 

function setup()
{
    canvasSize(1200, 800);
    loadImg(0, "image/ball/bg.png");
    for(var i = 0; i < BALL_MAX; i++) loadImg(1+i, "image/ball/ball" + i + ".png");
    var SND = ["bgm", "win", "lose", "se_shot", "se_hit", "se_recover"];
    for(var i = 0; i < SND.length; i++) loadSound(i, "sound/ball/" + SND[i] + ".m4a");
    initVar();
}

var idx = 0;
var tmr = 0;
function mainloop()
{
    var i, n, x, y;
    tmr++;
    drawImg(0,0,0); // 背景
    drawBall();

    switch(idx)
    {
        case 0: //タイトル画面
            fText("Dragon", 400, 320, 100, "red");
            fText("Marbles", 800, 320, 100, "blue");
            if(tmr % 40 < 20) fText("TAP TO START.", 600, 520, 50, "lime");
            if(tapC > 0)
            {
                initVar();
                idx = 1;
                tmr = 0;
            }
            break;

        case 1: // チーム選択
            sRect(300, 100, 298, 600, TEAM_COL[0]);
            fText("Girls", 450, 380, 80, TEAM_COL[0]);
            sRect(602, 100, 298, 600, TEAM_COL[1]);
            fText("Boys", 750, 380, 80, TEAM_COL[1]);
            if(tmr % 40 < 20) fText("SELECT TEAM", 600, 480, 40, "orange");
            if(tapC> 0 && tmr > 30)
            {
                team = 0;
                if(tapX > 600) team = 1;
                bnum = team * 3 - 1;
                if(rnd(100) < 50) bnum = (1 - team) * 3 - 1; //COMの先行
                idx = 2;
                tmr = 0;
                playBgm(0);
            } 
            break;

        case 2: //ボールを操作する順番を決める
            bnum += 1;
            if(bnum == BALL_MAX) bnum = 0;
            if(life[bnum] > 0)
            {
                if(G_OR_B[bnum] == team) //プレイヤーのボール
                {
                    ally = team;
                    drag = 0;
                    idx = 3;
                    tmr = 0;
                }
                else // COMのボール
                {
                    ally = 1 - team;
                    idx = 4;
                    tmr = 0;
                }
            }
            break;

        case 3: //プレイヤーチームの操作
            fText("Your Turn.", 600, 400, 50, "white");
            if(tmr % 20 < 10) cursor[bnum] = "white";
            if(myBall() == true) idx = 5;
            break;

        case 4: //COMチームの操作(ゲーム用のAI)
            fText("Com's Turn.", 600, 400, 50, "white")
            if(tmr % 20 < 10) cursor[bnum] = "yellow";
            if(tmr >= 90)
            {
                var eTapX = rnd(1200); // COMも画面タップで操作するとした時のタップ位置
                var eTapY = rnd(800); // ランダムな値を入れておき、次のFOR文で狙う相手を決める
                for(i = 0; i < 10; i++)
                {
                    n = rnd(BALL_MAX);
                    if(life[n] > 0 && G_OR_B[n] == team)
                    {
                        x = ballX[bnum] - (ballX[n] - ballX[bnum]);
                        y = ballY[bnum] - (ballY[n] - ballY[bnum]);
                        if(0 < x && x < 1200 && 0 < y && y < 800)
                        {
                            eTapX = x;
                            eTapY = y;
                            break;
                        }
                    }
                }
                playSE(3);
                ballVx[bnum] = (ballX[bnum] - eTapX) / hipparuIntensity;
                ballVy[bnum] = (ballY[bnum] - eTapY) / hipparuIntensity;
                idx = 5;
            }
            break;

        case 5: //全てのボールを動かす
            if(moveBall() == BALL_MAX)
            {
                idx = 2;
                tmr = 0;
                if(life[0] + life[1] + life[2] == 0) // Girlsのチーム全滅？
                {
                    victory = 1;
                    idx = 6;
                }
                if(life[3] + life[4] + life[5] == 0) // Boysのチーム全滅？
                {
                    victory = 0;
                    idx = 6;
                }
            }
            break;

            case 6: //ゲームの結果の表示
                if(tmr == 1) stopBgm();
                if(victory == team)
                {
                    fText("You Win!", 600, 400, 80, "cyan");
                    if(tmr == 2) playSE(1);
                }
                else
                {
                    fText("Com wins.", 600, 400, 80, "gold");
                    if(tmr == 2) playSE(2);
                }
                if(tmr == 30 * 8) idx = 0;
                break;
    }
}

function moveBall()
{
    var cnt = 0;
    for(var i = 0; i < BALL_MAX; i++)
    {
        ballX[i] += ballVx[i];
        ballY[i] += ballVy[i];
        if(ballX[i] < 340 && ballVx[i] < 0) ballVx[i] = -ballVx[i];
        if(ballX[i] > 860 && ballVx[i] > 0) ballVx[i] = -ballVx[i];
        if(ballY[i] < 140 && ballVy[i] < 0) ballVy[i] = -ballVy[i];
        if(ballY[i] > 660 && ballVy[i] > 0) ballVy[i] = -ballVy[i];
        ballVx[i] *= frictionFactor;
        ballVy[i] *= frictionFactor;
        if(abs(ballVx[i]) < 1 && abs(ballVy[i]) < 1)
        {
            ballVx[i] = 0;
            ballVy[i] = 0;
            cnt++; //止まっているボールの数を数える
        }
        if(life[i] == 0) continue;
        for(var j = 0; j < BALL_MAX; j++)
        {
            if(i == j) continue;
            if(life[j] > 0 && getDis(ballX[i], ballY[i], ballX[j], ballY[j]) <= 80)
            {
                var sp0 = Math.sqrt(ballVx[i] * ballVx[i] + ballVy[i] * ballVy[i]); // ボール０の速度
                var sp1 = Math.sqrt(ballVx[j] * ballVx[j] + ballVy[j] * ballVy[j]); //　ボール１の速度
                var spa = (sp0 + sp1) / 2; //　二つのボールの平均速度
                var dx = ballX[i] - ballX[j]; //中心座標間の距離（X軸）
                var dy = ballY[i] - ballY[j]; //中心座標間の距離（Y軸）
                var ang = Math.atan2(dy, dx); // 角度を求める
                // ボール０の速さを代入
                ballVx[i] = spa * Math.cos(ang);
                ballVy[i] = spa * Math.sin(ang);
                // ボール１の速さを代入
                ballVx[j] = -ballVx[i];
                ballVy[j] = -ballVy[i];
                if(i == bnum) hitBall(i, j);
                else if(j == bnum) hitBall(j, i);
            }
        }
    }
    return cnt;
}

function drawBall() //ボールを描く関数
{
    for(var i = 0; i < BALL_MAX; i++)
    {
        if(life[i] == 0)
        {
            fText("lost.", ballX[i], ballY[i], 40, "silver");
        }
        else
        {
            drawImgC(1 + i, ballX[i], ballY[i]);
            lineW(3);
            sCir(ballX[i], ballY[i], 39, TEAM_COL[G_OR_B[i]]);
            fText(life[i], ballX[i], ballY[i] + 24, 24, "lime");
        }
        if(cursor[i] != "")
        {
            lineW(4);
            sRect(ballX[i] - 40, ballY[i] - 40, 80, 80, cursor[i]);
            cursor[i] = "";
        }
        if(eff_tmr[i] > 0)
        {
            eff_tmr[i]--;
            setAlp(50);
            fCir(ballX[i], ballY[i], 50, eff_col[i]);
            setAlp(100);
        }
    }
}

function myBall()
{
    if(drag == 0) //つかむ
    {
        if(tapC == 1 && getDis(tapX, tapY, ballX[bnum], ballY[bnum]) < 60) drag = 1;
    }
    if(drag == 1) // 引っ張る
    {
        //引く強さがわかるように多角形を表示
        lineW(3);
        sPol([tapX - 30, tapY, tapX + 30, tapY, ballX[bnum], ballY[bnum]], "silver"); //sPol([配列]、色), Polygonを描く関数
        sPol([tapX, tapY - 30, tapX, tapY + 30, ballX[bnum], ballY[bnum]], "lightgray");
        sPol([tapX - 30, tapY, tapX, tapY + 30, tapX + 30, tapY, tapX, tapY - 30], "white");
        //どの向きに飛ぶかわかるように線を表示
        var dx = ballX[bnum] - tapX;
        var dy = ballY[bnum] - tapY;
        line(ballX[bnum], ballY[bnum], ballX[bnum] + dx, ballY[bnum] + dy, "blue");
        if(tapC == 0) // 離した時
        {
            if(tapX < 10 || 1190 < tapX || tapY < 10 || 790 < tapY)
            {
                drag = 0;
            }
            else if(getDis(tapX, tapY, ballX[bnum], ballY[bnum]) < 60)
            {
                drag = 0;
            }
            else
            {
                playSE(3);
                ballVx[bnum] = (ballX[bnum] - tapX) / hipparuIntensity;
                ballVy[bnum] = (ballY[bnum] - tapY) / hipparuIntensity;
                return true;
            }
        }
    }
    return false;  
}

function hitBall(n1, n2)
{
    if(eff_tmr[n2] > 0) return; //連続して処理が通らないようにする
    if(G_OR_B[n2] == ally) // 味方に当てた
    {
        if(CURE[n1] > 0)
        {
            life[n2] += CURE[n1];
            if(life[n2] > LIFE[n2]) life[n2] = LIFE[n2];
            setEffect(n2, "lime", 10);
            playSE(5);
        }
    }
    else{
        life[n2] -= POWER[n1];
        if(life[n2] < 0) life[n2] = 0;
        setEffect(n2, "red", 10);
        playSE(4);
    }
}

function setEffect(n, c, t)
{
    eff_col[n] = c;
    eff_tmr[n] = t;
}

function initVar()//配列に初期値を代入
    {
        for(var i = 0; i < BALL_MAX; i++)
        {
            ballX[i] = BALLX[i];
            ballY[i] = BALLY[i];
            ballVx[i] = 0;
            ballVy[i] = 0;
            cursor[i] = "";
            life[i] = LIFE[i];
            eff_col[i] = 0;
            eff_tmr[i] = 0;
        }
    }
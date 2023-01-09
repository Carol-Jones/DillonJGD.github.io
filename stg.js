// 起動時の処理
function setup()
{
    canvasSize(1200,720);
    loadImg(0, "image/stg/bg.png");
    loadImg(1, "image/stg/spaceship.png");
    loadImg(2, "image/stg/missile.png");
    loadImg(3, "image/stg/explode.png");
    for(var i = 0; i <= 4; i++) loadImg(4 + i, "image/stg/enemy" + i + ".png");
    for(var i = 0; i <= 2; i++) loadImg(9 + i, "image/stg/item" + i + ".png");
    loadImg(12, "image/stg/laser.png");
    loadImg(13, "image/stg/title_ss.png");
    loadSound(0, "sound/stg/bgm.m4a");
    initShip();
    initMissile();
    initObject();
    initEffect();
}

// メインループ
var tmr = 0;
var idx = 0;
var score = 0;
var hisco = 10000;
var stage = 0;
function mainloop()
{
    tmr++;
    drawBG(1);

    switch(idx)
    {
        case 0: //タイトル画面
        drawImg(13, 200, 200);
        if(tmr % 40 < 20) fText("Press [SPC] or Tap to Start.", 600, 540, 40, "cyan");
        if(key[32]> 0 || tapC > 0)
        {
            initShip();
            initObject();
            score = 0;
            stage = 1;
            idx = 1;
            tmr = 0;
            playBgm(0);
        }
        break;

        case 1: //ゲーム中
        setEnemy();
        setItem();
        moveSShip();
        moveMissile();
        moveObject();
        drawEffect();
        for(i = 0; i < 10; i++) fRect(20 + i * 30, 660, 20, 40, "#c00000");
        for(i = 0; i < energy; i++) fRect(20 + i * 30, 660, 20, 40, colorRGB(160 - 16 * i, 240-12 * i, 24 * i));
        if(tmr < 30 * 4) fText("STAGE" + stage, 600, 300, 50, "cyan");
        if(30 * 114 < tmr && tmr < 30 * 118) fText("STAGE CLEAR", 600, 300, 50, "cyan");
        if(tmr == 30 * 120)
        {
            stage++
            tmr = 0;
            weapon = 0;
        }
        break;

        case 2: //ゲームオーバー
        if(tmr < 30 * 2 && tmr % 5 == 1) setEffect(ssX + rnd(120) -60, ssY + rnd(80) - 40, 9);
        moveMissile();
        moveObject();
        drawEffect();
        fText("GAME OVER", 600, 300, 50, "red");
        if(tmr > 30 * 5) idx = 0;
        break;

    }

    fText("SCORE " + score, 200, 50, 40, "white");
    fText("HISCORE " + hisco, 600, 50, 40, "yellow");
    
}

// --------------------------- 背景をスクロール -----------------------------
var bgX = 0;
function drawBG(spd)
{
    bgX = (bgX + spd) % 1200;
    //左右に２枚の画像を並べて描く
    drawImg(0, -bgX, 0);
    drawImg(0, 1200-bgX, 0); 
    var hy = 580; //地面の地平線のY座標
    var ofsx = bgX % 40; // 縦のラインを移動させるオフセット値
    lineW(2);
    for(var i = 1; i <= 30; i++) // 縦のライン
    {
        var tx = i * 40 - ofsx; // 線の奥側のX座標
        var bx = i * 240 - ofsx * 6 - 3000; // 線の手前側のX座標
        line(tx, hy, bx, 720, "silver");
    }
    for(var i = 1; i < 12; i++) //横のライン
    {
        lineW(1 + int(i / 3));
        line(0, hy, 1200, hy, "gray");
        hy = hy + i * 2;
    }
}

// ------------------------------- 宇宙船の管理 ---------------------------
var ssX = 0;
var ssY = 0;
var ssSp = 20;
var automa = 0;
var energy = 0;
var muteki = 0;
var weapon = 0;
var laser = 0;

function initShip()
{
    ssX = 400;
    ssY = 360;
    energy = 10; //ゲームのHP
}
function moveSShip() 
{
    if(key[37] > 0 && ssX > 60) ssX -= ssSp; // 左
    if(key[39] > 0 && ssX < 1000) ssX += ssSp; // 右
    if(key[38] > 0 && ssY > 40) ssY -= ssSp; // 上
    if(key[40] > 0 && ssY < 680) ssY += ssSp; // 下
    if(key[65] == 1) // A
    {
        key[65]++;
        automa = 1 - automa;
    }
    if(automa == 0 && key[32] == 1)
    {
        key[32]++; // SPACE
        setWeapon();
    }
    if(automa == 1 && tmr % 8 == 0) setWeapon();
    var color = "black";
    if(automa == 1) color = "white";
    fRect(900, 20, 280, 60, "blue");
    fText("[A]uto Missile", 1040, 50, 36, color);

    if(tapC > 0) //タップ操作
    {
        if(900 < tapX && tapX < 1180 && 20 < tapY && tapY < 80) {
            tapC = 0;
            automa = 1 - automa;
        }
        else {
            ssX = ssX + int((tapX - ssX) / 6);
            ssY = ssY + int((tapY - ssY) / 6);
        }
    }

    if(muteki % 2 == 0) drawImgC(1, ssX, ssY); //引数の座標を画像の中心として描く関数です。
    if(muteki > 0) muteki--;
}

//複数の球を一度に放つ関数
// 同時にいくつ撃つか
//　最大９個（０〜８）とする
function setWeapon() 
{
    var n = weapon;
    if(n > 8) n = 8;
    //　for文でミサイルをセットする関数を実行
    for(var i = 0; i <= n; i++) setMissile(ssX + 40, ssY - n * 6 + i * 12, 40, int((i - n / 2) * 2));
}

// ------------------------- 発射の処理 --------------------------------
var MSL_MAX = 100;
var mslX = new Array(MSL_MAX);
var mslY = new Array(MSL_MAX);
var mslXsp = new Array(MSL_MAX);
var mslYsp = new Array(MSL_MAX);
var mslF = new Array(MSL_MAX);
var mslImg = new Array(MSL_MAX);
var mslNum = 0;


function initMissile()
{
    for( var i = 0; i < MSL_MAX; i++) mslF[i] = false;
    mslNum = 0;
}

function setMissile(x, y, xSp, ySp)
{
    mslX[mslNum] = x;
    mslY[mslNum] = y;
    mslXsp[mslNum] = xSp;
    mslYsp[mslNum] = ySp;
    mslF[mslNum] = true;
    mslImg[mslNum] = 2; //通常弾
    if(laser > 0) //レーザー弾を打てるなら
    {
        laser--; //レーザー弾の数を１減らす
        mslImg[mslNum] = 12;
    }
    mslNum = (mslNum + 1) % MSL_MAX;
}

function moveMissile()
{
    for(var i = 0; i < MSL_MAX; i++)
    {
        if(mslF[i] == true)
        {
            mslX[i] = mslX[i] + mslXsp[i];
            mslY[i] = mslY[i] + mslYsp[i];
            drawImgC(mslImg[i], mslX[i], mslY[i]);
            if(mslX[i] > 1200) mslF[i] = false;
        }
    }
}

// -------------------------- オブジェクト管理 -----------------------------
var OBJ_MAX = 100;
var objType = new Array(OBJ_MAX); // 0 = 敵の球、 1 = 敵機, 2アイテム
var objImg = new Array(OBJ_MAX);
var objX = new Array(OBJ_MAX);
var objY = new Array(OBJ_MAX);
var objXsp = new Array(OBJ_MAX);
var objYsp = new Array(OBJ_MAX);
var objF = new Array(OBJ_MAX);
var objLife = new Array(OBJ_MAX);
var objNum = 0;

function initObject()
{
    for(var i = 0; i < OBJ_MAX; i++) objF[i] = false;
    objNum = 0;
}

function setObject(typ, png, x, y, xSp, ySp, lif)
{
    objType[objNum] = typ;
    objImg[objNum] = png;
    objX[objNum] = x;
    objY[objNum] = y;
    objXsp[objNum] = xSp;
    objYsp[objNum] = ySp;
    objLife[objNum] = lif;
    objF[objNum] = true;
    objNum = (objNum + 1) % OBJ_MAX;
}

function moveObject()
{
    for(var i = 0; i < OBJ_MAX; i++)
    {
        if(objF[i] == true)
        {
            objX[i] += objXsp[i];
            objY[i] += objYsp[i];
            if(objImg[i] == 6) //上下動く敵
            {
                if(objY[i] < 60) objYsp[i] = 8;
                if(objY[i] > 660) objYsp[i] = -8;
            }
            if(objImg[i] == 7) // 敵３の動きを計算
            {
                // 左へ移動しているなら減速（X軸方向の移動量を減らす）
                if(objXsp[i] < 0)　// その値が０になったら弾を撃ち右へ飛べ去らせる
                {
                    objXsp[i] = int(objXsp[i]*0.95);
                    if(objXsp[i] == 0)
                    {
                        setObject(0, 4, objX[i], objY[i], -20, 0, 0);
                    }
                }
            }
            drawImgC(objImg[i], objX[i], objY[i]);
            if(objType[i] == 1 && rnd(100) < 3) setObject(0, 4, objX[i], objY[i], -24, 0);
            if(objX[i] < 0) objF[i] = false;
            //自機が撃った弾とヒットチェック
            if(objType[i] == 1) //敵機
            {
                var r = 12 + (img[objImg[i]].width + img[objImg[i]].height) / 4; // 球を半径１２ドット円、r1 + r2
                for(var n = 0; n < MSL_MAX; n++)
                {
                    if(mslF[n] == true)
                    {
                        if(getDis(objX[i], objY[i], mslX[n], mslY[n]) < r) // dis < r1 + r2
                        {
                            if(mslImg[n] == 2) mslF[n] = false; //敵機とのヒットチェックで通常弾であれば弾を消す
                            objLife[i]--;
                            if(objLife[i] == 0)
                            {
                                objF[i] = false;
                                score = score + 100;
                                if(score > hisco) hisco = score;
                                setEffect(objX[i], objY[i], 9);
                            }
                            else
                            {
                                setEffect(objX[i], objY[i], 3);
                            }
                        }
                    }
                }
            }
            //自機のヒットチェック
            var r = 30 + (img[objImg[i]].width + img[objImg[i]].height) / 4;
            if(getDis(objX[i], objY[i], ssX, ssY) < r)
            {
                if(objType[i] <= 1 && muteki == 0) //敵の弾と敵機
                {
                    objF[i] = false;
                    energy--;
                    muteki = 30;
                    if(energy <= 0)
                    {
                        idx = 2;
                        tmr = 0;
                        stopBgm();
                    }
                }
                if(objType[i] == 2)//アイテム
                {
                    objF[i] = false;
                    if(objImg[i] == 9 && energy < 10) energy++; // エネルギー回復アイテムの計算
                    if(objImg[i] == 10) weapon++; //弾の数が増えるアイテムの計算
                    if(objImg[i] == 11) laser = laser + 100; // レーズー弾のアイテムの計算
                }
            }
            if(objX[i] < -100 || objX[i] > 1300 || objY[i] < -100 || objY[i] > 820)
            {
                objF[i] = false;
            }
        }
    }
}

function setItem()
{
    if(tmr % 90 ==  0) setObject(2, 9, 1300, 60 + rnd(600), -10, 0, 0); // Energy
    if(tmr % 90 == 30) setObject(2, 10, 1300, 60 + rnd(600), -10, 0, 0); // Missile
    if(tmr % 90 == 60) setObject(2, 11, 1300, 60 + rnd(600), -10, 0, 0); // Laser
}

// ------------------------- エフェクト（爆発演出）の管理 ---------------------------
var EFCT_MAX = 100;
var efctX = new Array(EFCT_MAX);
var efctY = new Array(EFCT_MAX);
var efctN = new Array(EFCT_MAX); //何番号の絵を表示するか
var efctNum = 0;

function initEffect()
{
    for(var i = 0; i < EFCT_MAX; i++) efctN[i] = 0;
    efctNum = 0;
}

function setEffect(x, y, n)
{
    efctX[efctNum] = x;
    efctY[efctNum] = y;
    efctN[efctNum] = n;
    efctNum = (efctNum + 1) % EFCT_MAX;
}

function drawEffect()
{
    for(var i = 0; i < EFCT_MAX; i++)
    {
        if(efctN[i] > 0)
        {
            // drawImgTSは画像を出したり拡大縮小したりして表示する関すです。
            // (画像番号、画像上の（X,Y)座標、幅、高さ、キャンバス上の（X,Y)座標、幅、高さ）
            drawImgTS(3, (9 - efctN[i]) * 128, 0, 128, 128, efctX[i] - 64, efctY[i] - 64, 128, 128);
            efctN[i]--;
        }
    }
}

// ----------------------------- 敵の管理 -------------------------------
function setEnemy()
{
    var sec = int(tmr/30); //経過少数
    if(4 <= sec && sec < 10)
    {
        if(tmr % 60 == 0) setObject(1, 5, 1300, 60+rnd(600), -16, 0, 1 * stage); //敵１
    }
    if(14 <= sec && sec < 20)
    {
        if(tmr % 60 == 10) setObject(1, 6, 1300, 60 + rnd(600), -12, 8, 3 * stage); //敵２
    }
    if(24 <= sec && sec < 30)
    {
        if(tmr % 60 == 20) setObject(1, 7, 1300, 360 + rnd(300), -48, -10, 5 * stage); //敵３
    }
    if(34 <= sec && sec < 50)
    {
        if(tmr % 60 == 30) setObject(1, 8, 1300, rnd(720-192), -6, 0, 0); //障害物
    }
    if(54 <= sec && sec < 70)
    {
        if(tmr % 20 == 0)
        {
            setObject(1, 5, 1300, 60 + rnd(300), -16, 4, 1 * stage); //敵１
            setObject(1, 5, 1300, 360 + rnd(300), -16, 4, 1 * stage); //敵１
        }
    }
    if(74 <= sec && sec < 90)
    {
        if(tmr % 20 == 0) setObject(1, 6, 1300, 60 + rnd(600), -12, 8, 3 * stage); //敵２
        if(tmr % 45 == 0) setObject(1, 8, 1300, rnd(720-192), -6, 0, 0); //障害物
    }
    if(94 <= sec && sec < 110)
    {
        if(tmr % 10 == 0) setObject(1, 5, 1300, 360, -24, rnd(11) - 5, 1 * stage); //敵１
        if(tmr % 20 == 0) setObject(1, 7, 1300, rnd(300), -65, 4 + rnd(12), 5 * stage); //敵３
    }
}
package com.obok.sudoku;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 안드로이드 웹뷰는 기본적으로 '사용자가 한 번 누르기 전에는 소리 금지' 다.
        // 브라우저에서는 이 규칙을 못 푼다(웹 표준이고, 광고가 멋대로 소리를 내는 걸 막는 장치다).
        // 하지만 우리 앱 안의 웹뷰는 우리 것이므로 끌 수 있다.
        //
        // 왜 끄는가: 타이틀 화면은 '수호신을 만나러 들어가는 순간'을 만드는 화면이고,
        // 그 분위기의 절반이 음악에서 나온다. 첫 화면이 조용하면 그냥 그림 한 장이 된다.
        // 소리가 싫은 사람은 홈 화면 아래 버튼으로 끌 수 있고, 그 선택은 저장된다.
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}

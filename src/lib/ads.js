// ============================================================================
//  ads.js — 앱 6개 공용 광고 엔진 (v2)
//  작성 2026-09-17 / 원본: 오복사주 → 타로 → MBTI 로 복사돼 오던 v1 을 대체한다.
//
//  v1 에서 무엇이 달라졌나 — 네 가지다.
//
//   1. 동의창(UMP) 이 생겼다.        v1 엔 아예 없었다. 2026-03-01 부터 유럽 의무.
//   2. 리워드 광고가 생겼다.          v1 엔 배너·전면뿐이었다. 수익의 큰 쪽이 여기다.
//   3. 전면광고 자리를 옮겼다.        '결과 보기 직전' → '결과를 다 보고 나갈 때'.
//   4. 광고 요청 전에 canRequestAds 를 확인한다. 동의 안 한 사용자에게 요청을 안 보낸다.
//
//  웹 브라우저에서는 전부 아무 동작도 하지 않는다(no-op). 안드로이드 앱에서만 동작한다.
//
//  ── 이 파일을 각 앱에 설치하는 법 ────────────────────────────────────────
//  src/lib/ads.js 로 복사한 뒤, 아래 REAL_IDS 세 줄만 그 앱 값으로 바꾼다.
//  나머지는 손대지 않는다. 앱마다 고쳐 쓰면 여섯 벌로 갈라지고, 그러면
//  정책이 바뀔 때마다 여섯 번 고쳐야 한다 — v1 이 정확히 그렇게 굳었다.
// ============================================================================

import { Capacitor } from '@capacitor/core'

// ── 광고 단위 ID ────────────────────────────────────────────────────────────
//
// 값 두 종류의 성격이 다르다.
//   앱 ID        AndroidManifest.xml 에 있다. '어느 앱인가'. 틀리면 앱이 아예 안 켜진다.
//   광고 단위 ID  이 파일에 있다.            '어느 자리인가'. 틀리면 그 자리만 안 뜬다.

// 구글 공식 테스트 ID. 이건 눌러도 계정이 정지되지 않는다 — 개발·테스트엔 반드시 이쪽.
const TEST_IDS = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  reward:       'ca-app-pub-3940256099942544/5224354917',
}

// 🔴 앱마다 이 세 줄을 바꾼다. 애드몹 콘솔에서 발급받은 실제 값.
//    빈 문자열로 두면 그 자리는 자동으로 테스트 ID 로 떨어진다 —
//    빈 값을 그대로 넘기면 광고만 조용히 안 뜨는데 원인 찾기가 매우 어렵다.
const REAL_IDS = {
  banner:       'ca-app-pub-9311950226943560/6326061114',
  interstitial: 'ca-app-pub-9311950226943560/1891992084',
  reward:       'ca-app-pub-9311950226943560/1927810204',
}

// 어느 쪽을 쓸지는 **빌드가 정한다. 사람이 고르지 않는다.**
//   테스트 APK (android.yml)        → VITE_ADS 없음  → 테스트 광고
//   출시 AAB   (android-release.yml) → VITE_ADS=real → 실제 광고
//
// 왜: 실광고가 붙은 테스트 APK 를 폰에 깔고 눌러보면 자기 광고를 클릭하게 되고
// 그건 애드몹 계정 정지 사유다. 그렇다고 "출시 직전에 손으로 바꾸자"고 하면
// 언젠가 반드시 잊는다 — 잊는 쪽이 출시본이면 그 앱 수익이 통째로 0 이 된다.
const useReal = import.meta.env.VITE_ADS === 'real'
const AD_IDS = {
  banner:       (useReal && REAL_IDS.banner)       || TEST_IDS.banner,
  interstitial: (useReal && REAL_IDS.interstitial) || TEST_IDS.interstitial,
  reward:       (useReal && REAL_IDS.reward)       || TEST_IDS.reward,
}

// 리워드 광고를 켤지. 실제 단위 ID 를 아직 못 받은 앱이 있어서 필요하다.
//
// 출시본(useReal)인데 REAL_IDS.reward 가 비어 있으면 **아예 안 켠다.**
// 그냥 두면 테스트 ID 로 떨어져서, 출시본이 구글 테스트 리워드 광고를 불러오게 된다 —
// 수익은 0 인데 애드몹 보고서에는 요청으로 잡혀서 채움율 숫자만 더럽혀진다.
const rewardEnabled = !useReal || !!REAL_IDS.reward

// 전면광고 최소 간격. 짧게 잡으면 사용자가 질리고 구글 정책에도 걸린다.
const MIN_INTERSTITIAL_GAP_MS = 70 * 1000

const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }

let mod = null
let started = false
let canRequestAds = false          // 동의 결과. false 면 광고 요청 자체를 안 보낸다.
let privacyOptionsRequired = false // 설정에 '광고 개인정보 설정' 버튼을 띄울지
let interstitialReady = false
let rewardReady = false
let lastInterstitialAt = 0

async function admob() {
  if (!mod) mod = await import('@capacitor-community/admob')
  return mod
}

// ── 동의창 (UMP) ────────────────────────────────────────────────────────────
//
// 유럽·영국 사용자에게 광고를 띄우려면 먼저 물어봐야 한다. 2026-03-01 부터 의무다.
// 안 물어보면 앱이 막히는 게 아니라 **그 트래픽의 광고 단가가 20~40% 깎인다.**
// 조용히 손해만 나기 때문에 빠진 걸 눈치채기 어렵다 — 그래서 v1 에 6개월째 없었다.
//
// 순서: initialize() 는 SDK 를 켜기만 한다. 실제 '광고를 달라는 요청'은
// showBanner()·prepareInterstitial()·prepareReward() 에서 나간다.
// 그래서 요청 직전에 canRequestAds 를 확인하는 것으로 충분하고, 그게 이 파일의 방식이다.
async function runConsentFlow() {
  try {
    const { AdMob, AdmobConsentStatus } = await admob()
    let info = await AdMob.requestConsentInfo()

    if (info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable) {
      info = await AdMob.showConsentForm()
    }

    // canRequestAds 는 플러그인 7.0.3 부터 있다.
    // 없는 버전이면 '동의가 필요 없거나 이미 받음'으로 판단한다.
    canRequestAds = (typeof info.canRequestAds === 'boolean')
      ? info.canRequestAds
      : (info.status === AdmobConsentStatus.NOT_REQUIRED || info.status === AdmobConsentStatus.OBTAINED)

    privacyOptionsRequired = info.privacyOptionsRequirementStatus === 'REQUIRED'
  } catch (e) {
    // 동의창 자체가 실패하면(네트워크 등) 광고를 포기하는 게 아니라 그냥 진행한다.
    // 유럽 밖 사용자가 대부분인데 여기서 막으면 멀쩡한 수익까지 0 이 된다.
    canRequestAds = true
  }
}

// 설정 화면에 붙일 '광고 개인정보 설정' 버튼.
// privacyOptionsRequired 가 true 인 사용자에게만 보이면 된다(유럽 등).
export function needsPrivacyOptionsButton() { return privacyOptionsRequired }

export async function openPrivacyOptions() {
  if (!isNative()) return
  try { const { AdMob } = await admob(); await AdMob.showPrivacyOptionsForm() } catch (e) {}
}

// ── 시작 ────────────────────────────────────────────────────────────────────
// 앱 시작 시 1회. 동의를 받고, 전면·리워드를 미리 예열해 둔다.
// **배너는 여기서 띄우지 않는다.** 시작 화면 하단이 버튼 자리인 앱이 있어서
// 앱마다 적절한 시점에 showBanner() 를 직접 불러야 한다.
export async function initAds() {
  if (!isNative() || started) return
  started = true
  try {
    const { AdMob } = await admob()
    await AdMob.initialize({})
    await runConsentFlow()
    await wireBannerHeight()
    prepareInterstitial()   // 미리 준비(기다리지 않음)
    prepareReward()
  } catch (e) { /* 광고 실패가 앱 동작을 막으면 안 된다 */ }
}

// ── 배너 ────────────────────────────────────────────────────────────────────
//
// 절대 하지 말 것: 배너를 **입력 키패드·조준면·계속 움직이는 화면 옆**에 두는 것.
//   애드몹이 '권장하지 않는 구현'으로 직접 명시했고, 적발되면 조치가 앱이 아니라
//   **계정 단위**로 떨어진다 = 앱 6개가 동시에 광고 중단이다.
//
// 참고: 2026-02 에 나온 large anchored adaptive 배너(단가 +27~200%)는
// @capacitor-community/admob 8.1.0 이 아직 노출하지 않는다.
// 이 플러그인이 주는 크기는 BANNER / ADAPTIVE_BANNER / FULL_BANNER /
// LEADERBOARD / MEDIUM_RECTANGLE / SMART_BANNER 뿐이다.
// 그래서 지금은 ADAPTIVE_BANNER 가 최선이고, 교체는 플러그인 업데이트를 기다려야 한다.
export async function showBanner() {
  if (!isNative() || !canRequestAds) return
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await admob()
    await AdMob.showBanner({
      adId: AD_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    })
  } catch (e) {}
}

export async function hideBanner() {
  if (!isNative()) return
  try { const { AdMob } = await admob(); await AdMob.hideBanner() } catch (e) {}
}

// 배너 실제 높이를 CSS 변수로 넘겨서 하단 UI 가 광고에 가려지지 않게 한다
async function wireBannerHeight() {
  try {
    const { AdMob, BannerAdPluginEvents } = await admob()
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
      const h = info && info.height ? Number(info.height) : 0
      document.documentElement.style.setProperty('--ad-banner-h', h > 0 ? h + 'px' : '0px')
    })
  } catch (e) {}
}

// ── 전면광고 ────────────────────────────────────────────────────────────────
async function prepareInterstitial() {
  if (!canRequestAds) { interstitialReady = false; return }
  try {
    const { AdMob } = await admob()
    await AdMob.prepareInterstitial({ adId: AD_IDS.interstitial })
    interstitialReady = true
  } catch (e) { interstitialReady = false }
}

// 올바른 자리 — 사용자가 **콘텐츠를 다 보고 빠져나가는 전환**에서 부른다.
//   (결과를 닫고 첫 화면으로 / 한 판 끝내고 목록으로)
//
// 부르면 안 되는 자리 — 구글 하드룰이다.
//   · 결과·콘텐츠가 **나오기 직전**   ← v1 이 여기서 띄우고 있었다
//   · 앱을 켜자마자
//   · 뒤로가기를 눌렀을 때
//
// 기다리던 걸 광고가 가로막으면 사용자는 광고를 보는 게 아니라 앱을 지운다.
// 그리고 2026 년 플레이스토어 순위는 설치수가 아니라 **재방문율(D7/D30)** 로 매겨진다.
// 결과 앞 전면광고는 수익을 며칠 앞당기는 대신 그 순위 신호를 갉아먹는 거래다.
export async function showInterstitialOnExit() {
  if (!isNative() || !canRequestAds) return
  if (Date.now() - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return
  try {
    const { AdMob } = await admob()
    if (!interstitialReady) await prepareInterstitial()
    if (!interstitialReady) return
    await AdMob.showInterstitial()
    lastInterstitialAt = Date.now()
    interstitialReady = false
    prepareInterstitial() // 다음 광고 미리 준비
  } catch (e) {}
}

// ── 리워드 광고 ─────────────────────────────────────────────────────────────
//
// 여기가 큰 쪽이다. 한 일본 개인 개발자가 공개한 비중은
// **리워드 약 80% / 전면 10~20% / 배너 10% 미만.**
// v1 은 배너와 전면만 있었으니 작은 쪽 절반만 가져가고 있었던 셈이다.
//
// 게다가 리워드는 구글의 '방해되는 광고' 정책에서 **유일하게 면제**되는 형식이다.
// 사용자가 스스로 "보겠다"를 누르기 때문이다. 그래서 다는 쪽이 심사 위험이 오히려 내려간다.
//
// 지켜야 할 것 하나 — **보상을 먼저 주지 않는다.** showRewarded() 가 true 를 준 뒤에만 준다.
// 중간에 닫으면 false 다. false 인데 보상을 주면 아무도 끝까지 안 본다 = 수익 0.
async function prepareReward() {
  if (!rewardEnabled || !canRequestAds) { rewardReady = false; return }
  try {
    const { AdMob } = await admob()
    await AdMob.prepareRewardVideoAd({ adId: AD_IDS.reward })
    rewardReady = true
  } catch (e) { rewardReady = false }
}

// 버튼을 보일지 말지 판단용. 광고가 없는데 버튼만 있으면 눌러도 아무 일이 없어서
// 사용자는 '앱이 고장났다'고 읽는다 — 그게 별점 1점이 된다.
export function isRewardedReady() { return rewardReady }

// 끝까지 봤으면 true, 중간에 닫았거나 실패면 false.
export async function showRewarded() {
  if (!isNative() || !rewardEnabled || !canRequestAds) return false
  try {
    const { AdMob } = await admob()
    if (!rewardReady) await prepareReward()
    if (!rewardReady) return false
    const item = await AdMob.showRewardVideoAd()
    rewardReady = false
    prepareReward()            // 다음 광고 미리 준비
    return !!item              // 보상을 받은 경우에만 객체가 온다
  } catch (e) {
    rewardReady = false
    prepareReward()
    return false
  }
}

// ── 하위호환 ────────────────────────────────────────────────────────────────
// v1 을 쓰던 호출부가 그대로 돌아가게 남겨둔다. 다만 **자리가 틀린 이름**이라
// 호출부를 showInterstitialOnExit() 으로 옮기는 작업이 끝나면 이 두 줄은 지운다.
/** @deprecated 자리가 틀렸다. showInterstitialOnExit() 으로 옮길 것. */
export const showInterstitialBeforeResult = showInterstitialOnExit
/** @deprecated 자리가 틀렸다. showInterstitialOnExit() 으로 옮길 것. */
export const maybeShowInterstitial = showInterstitialOnExit

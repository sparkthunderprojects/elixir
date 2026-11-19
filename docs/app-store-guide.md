# Elixir Points app: how to publish on the App Store and Google Play

The app project is in the `mobile/` folder of the repository `sparkthunderprojects/elixir`.
It is a thin app around https://elixirpoints.com. Anything you change on the website (via the content editor or in code)
shows up in the app straight away. You only make a new store release when you change the icon, name, version or plugins.

**App id (permanent once uploaded):** `com.sparkthunder.elixir`   **Name:** Elixir Points   **Version:** 1.0 (build 1)

## 0. Before you start (both stores)

1. **Live website first.** The app loads elixirpoints.com, so the latest code (brand pages, delete account, mobile layout, support page) must be deployed there. Open https://elixirpoints.com/support and sign in to check My Elixir.
2. **Support email.** The Support page shows support@elixirpoints.com unless you set `NEXT_PUBLIC_ELIXIR_SUPPORT_EMAIL` in Bolt. Make sure that mailbox exists, or set a real one.
3. **Privacy policy and Terms.** The stores need a public privacy policy link. The site links to mysparkthunder.com/privacy and /terms. Check that the privacy policy covers Elixir Points (name, email, purchase and points history, how to delete) and fix it if not.
4. **A reviewer login.** Create a test member account (verified email and password) with some points, so the store reviewers can sign in. You will paste it into the review notes.

## 1. Apple App Store (needs a Mac)

You need: Apple Developer Program membership (£79 a year), a Mac with Xcode (free from the Mac App Store).

1. On the Mac: install Node.js, then `git clone https://github.com/sparkthunderprojects/elixir`, `cd elixir/mobile`, `npm install`, `npm run sync`, `npm run open:ios`. Xcode opens.
2. In Xcode click **App** (top of the left list) > **Signing & Capabilities**. Tick *Automatically manage signing* and choose your Team. The bundle identifier is `com.sparkthunder.elixir`.
3. In App Store Connect (appstoreconnect.apple.com) > Apps > **+** > New App. Platform iOS, name *Elixir Points*, bundle ID `com.sparkthunder.elixir`, SKU `elixir-points`.
4. In Xcode set the run target to **Any iOS Device (arm64)**, then **Product > Archive**. When it finishes, **Distribute App > App Store Connect > Upload**.
5. In App Store Connect open the app, **TestFlight** to check the build on your own iPhone first, then fill in the **App Store** page using the listing text below.
6. **App Privacy:** declare Contact info (email, name), Purchases (points history), and User ID, all linked to the user and used for app functionality. No tracking.
7. **App Review Information:** paste the reviewer login and the review notes below. Submit for review. Reviews usually take 1 to 3 days.

## 2. Google Play (works on Windows, Mac or Linux)

You need: Google Play Console account (one-off £20) and Android Studio (free).

1. Install Node.js and Android Studio, then `git clone` the repository, `cd elixir/mobile`, `npm install`, `npm run sync`, `npm run open:android`.
2. In Android Studio wait for Gradle to finish syncing. Then **Build > Generate Signed Bundle / APK > Android App Bundle**. Create a new keystore when asked and **keep that file and its passwords safe forever** (back it up in two places; you cannot update the app without it). Choose the *release* build. You get a file called `app-release.aab`.
3. In Play Console (play.google.com/console) > **Create app**. Name *Elixir Points*, App, Free.
4. Complete the dashboard tasks: privacy policy URL, App access (give the reviewer login), Ads (No), Content rating questionnaire, Target audience (18+), Data safety (same data as the Apple privacy answers; data can be deleted by the user in the app and on the Support page), Store listing.
5. **Testing > Internal testing** (or Production) > Create release > upload the `.aab` > Save > Review release > Roll out. If your Play account is a new personal account, Google requires a closed test with 12 testers for 14 days before Production. Organisation accounts do not.

## 3. Store listing text

**App name:** Elixir Points (max 30)
**Subtitle / short description:** One rewards balance across every brand
**Promotional text:** Earn points at Sparkthunder Shop, Knightverge, Roll Combat and Miss Petty, and spend them anywhere in the family.

**Description:**
Elixir Points is the rewards programme for the Sparkthunder family of brands. Shop with any participating brand, collect points into one shared balance, and spend them on rewards at any brand.

- See your points balance, tier and full history
- Show your Elixir card in store with a scannable barcode and QR code
- Claim rewards and keep your reward codes handy
- Browse every participating brand and its rewards
- Earn extra with online shop offers and by inviting friends
- Move up tiers and earn points faster the more you shop

Free to join. Your points are always in your pocket.

**Keywords (Apple, 100 characters):** rewards,points,loyalty,cashback,offers,card,brands,shopping,wallet,comics,games,beauty
**Category:** Shopping (Apple) / Shopping (Google)
**Age rating:** 4+ (Apple), Everyone (Google)
**Support URL:** https://elixirpoints.com/support
**Marketing URL:** https://elixirpoints.com
**Privacy policy URL:** https://mysparkthunder.com/privacy

## 4. Review notes (paste into both stores)

Elixir Points is a free loyalty rewards app. Sign in with the test account below to see the wallet, card, rewards and brand pages:
Email: (your test member email)
Password: (your test password)
Account deletion: My Elixir tab > scroll to the bottom > Delete my Elixir account. Points can only be earned by buying from the partner brands' stores, which happens on their own websites.

## 5. Screenshots you need to take

- **Apple:** 6.9 inch iPhone (1320 x 2868) at least 3 screenshots. Use the Simulator in Xcode (iPhone 16 Pro Max) and press Cmd+S.
- **Google:** at least 2 phone screenshots, plus a 512 x 512 icon (use `mobile/assets/icon-only.png`, resized) and a 1024 x 500 feature graphic.
Suggested shots: wallet with balance, digital card, a brand page with its hero banner, rewards, tiers.

## 6. Things to know

- **Apple can reject web-based apps** under guideline 4.2 ("minimum functionality"). This app has an app-only mobile layout with tab bar, a scannable card, account deletion and a full sign-in flow, which helps. If Apple pushes back, tell me what they say; the usual fix is adding native features (push notifications, Face ID, wallet pass).
- **In-app purchases:** the app sells nothing digital, so no Apple or Google cut applies. Do not add paid points purchases without checking the store rules first.
- **Updating:** change the website and the app updates itself. For a new store version, raise the version number (Android: `versionCode` and `versionName` in `mobile/android/app/build.gradle`; iOS: Version and Build in Xcode), repeat the build steps and upload.
- **The Android keystore** and your Apple signing are yours alone. I have not created or seen either.

## 7. After the apps are live: turn on the website buttons

The home page shows "App Store" and "Google Play" buttons marked *Coming soon*. Once each app is live, add these in Bolt (environment variables) and redeploy:
- `NEXT_PUBLIC_ELIXIR_IOS_URL` = your App Store link
- `NEXT_PUBLIC_ELIXIR_ANDROID_URL` = your Google Play link
The buttons then become real links. Apple and Google also supply official badge images you may swap in.

# Elixir Points mobile app (iPhone and Android)

A Capacitor shell around https://elixirpoints.com/account. The website detects the app (the browser name
contains "ElixirApp") and switches to a mobile layout with a bottom tab bar. Updating the website updates the
app with no new store release, except when this folder changes (icon, plugins, version number).

- App id: com.sparkthunder.elixir (permanent once first uploaded)
- Version: edit `versionName` / `versionCode` in android/app/build.gradle and MARKETING_VERSION / CURRENT_PROJECT_VERSION in Xcode.

Commands (run inside this folder, after `npm install`):
- `npm run assets`   regenerate icons and splash from assets/
- `npm run sync`     copy config and plugins into the iOS and Android projects
- `npm run open:ios` opens Xcode (Mac only)
- `npm run open:android` opens Android Studio

Full submission steps are in docs/app-store-guide.md at the top of the repository.

# INSTALATION #

## Install Vue ##

1. Install Vue
npm install vue

2. Create a Vue project
npm create vue@3
project name: Class Management
select: vue router, pinia

3. Install Vite PWA
npm install vite-plugin-pwa --save-dev

4. Replace files
rimraf src - delete src folder
copy files from drive

5. Install dependencies
npm install


## Install Capacitor ##

1. Install Capacitor
npm install @capacitor/core @capacitor/cli

2. Initialize Capacitor
npx cap init
App name: Class Management
App id: com.classmanagement.app

3. Install Capacitor for Android APK
npm install @capacitor/android
npx cap add android

4. Install Capacitor for iOS APP
npm install @capacitor/ios
npx cap add ios


## Other instalations ##
Make sure all of the below is installed:

1. Capacitor Local Notifications plugin 
npm install @capacitor/local-notifications

2. Capacitor URL browser
npm install @capacitor/browser

3. Capacitor filestystem and share
npm install @capacitor/filesystem @capacitor/share

4. Capacitor file picker
npm install @capawesome/capacitor-file-picker

5. XLSX support
npm install xlsx



# RUNNING THE PROJECT #
npm run dev



# ANDROID APP #

## Building the app ##

1. Install Android Studio
https://developer.android.com/studio/install

2. Build app
npm run clean-build

3. On Android Studio
File > Sync project with gradle files
Build > Clean project
Run > Run app


## Export Android APK file ##

1. Build app
npm run clean-build

2. On Android Studio
File > Sync project with gradle files
Build > Clean project
Export .apk file: Build > Generate APK


## Debugging the Android app ##

1. On Android Studio
Open LogCat
Filter by: com.classmanagement.app

2. On Chrome
Go to chrome://inspect
Find 'WebView in com.classmanagement.app'
Click 'inspect' 



# CAPACITOR EXTRAS #

## Create icon and images assets with Capacitor ##
npm install @capacitor/assets --save-dev
create a /resources/ folder in the project root
add the following files to it:
- icon.png: 1024x1024px
- splash-light.png: 2732x2732px (background solid)
- splash-dark.png 2732x2732px (background solid)
- notification.png: 96x96px
npx capacitor-assets generate



# ANDROID PERMISSIONS #

Add the following permissions within <manifest>...</manifest> to your androidManifest.xlm file in ./android/app/src/main/AndroidManifest.xml

<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
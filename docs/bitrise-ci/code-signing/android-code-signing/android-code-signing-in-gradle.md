---
title: "Android code signing in Gradle"
description: "You can manually specify the code signing configuration in your Gradle configuration so that your app gets signed during the build process on Bitrise."
sidebar_position: 5
slug: /bitrise-ci/code-signing/android-code-signing/android-code-signing-in-gradle
---

You can manually specify the code signing configuration in your Gradle configuration so that your app gets signed during the build process.

1. Open your module-level `build.gradle` file.
1. Add the `signingConfigs` codeblock to your code and define the following entries specific to your project:

   - `storeFiled`
   - `storePassword`
   - `keyAlias`
   - `keyPassword`
1. Attach the signing config to a build type.
1. Build your app on Bitrise.

For more information, check out how to [configure Gradle to sign your app](https://developer.android.com/studio/publish/app-signing).

**Signing configuration in the build.gradle file**

In this example, your keystore path should have the same path locally and on [bitrise.io](https://www.bitrise.io) to ensure the build can use the keystore file.

```
android {
   // Make sure signingConfigs is defined before buildTypes.
   signingConfigs { 
   	   release { 
       	 keyAlias 'MyAndroidKey' 
         keyPassword '***' 
         storeFile file("/path/to/my/keystore.jks") 
         storePassword '***' 
       } 
   } 
  

  buildTypes {
      release {
          // Use signing config for build type
          signingConfig signingConfigs.release
          // ...
      }
  }
  // ...
```

**Using Environment Variables in the build.gradle file**

You can avoid having the same keystore path locally and on [bitrise.io](https://www.bitrise.io) by using configuration values and Environment Variables in the keystore path (`storeFile`) and in the keystore password.

You can use the `System.getenv("ENV_KEY")` file to access Environment Variables in the `build.gradle` file. Make sure to define the Environment Variables you use in your `build.gradle` file on [bitrise.io](https://www.bitrise.io) as well.

If your keystore path is `$HOME/keystores/my_keystore.jks`, then your `build.gradle` file should look like this:

```
android { 
   signingConfigs { 
   	   release { 
       	 keyAlias 'MyAndroidKey' 
         keyPassword '***' 
         storeFile file(System.getenv("HOME") + "/keystores/my_keystore.jks")
         storePassword '***' 
       } 
   } ...
```

You can then download the keystore file [using the File Downloader Step](/en/bitrise-ci/run-and-analyze-builds/managing-build-files/using-files-in-your-builds#downloading-a-file-using-the-file-downloader-step), using the `$HOME/keystores/my_keystore.jks` as the destination path.

If you use Environment Variables as `keyPassword` and `storePassword` on the **Code signing** tab, your `build.gradle` will look like this:

```
android {
   signingConfigs {
       release {
         keyAlias System.getenv("BITRISEIO_ANDROID_KEYSTORE_ALIAS")
         keyPassword System.getenv("BITRISEIO_ANDROID_KEYSTORE_PRIVATE_KEY_PASSWORD")
         storeFile file(System.getenv("HOME") + "/keystores/my_keystore.jks")
         storePassword System.getenv("BITRISEIO_ANDROID_KEYSTORE_PASSWORD")
       }
   }
   
   buildTypes {
      release {
          // Use signing config for build type
          signingConfig signingConfigs.release
          // ...
      }
   }
   ...
```

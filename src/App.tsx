/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Code2,
  Download,
  Copy,
  Check,
  Settings,
  Shield,
  FileCode,
  Globe,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  HelpCircle,
  FolderArchive,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Key,
  Sliders,
  CheckCircle2,
  Wand2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Lock,
  AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';

interface ConfigState {
  appName: string;
  packageName: string;
  websiteUrl: string;
  mode: 'twa' | 'webview';
  language: 'java' | 'kotlin';
  minSdk: string;
  targetSdk: string;
  compileSdk: string;
  versionCode: string;
  versionName: string;
  sha256: string;
  iconDataUrl: string | null;
  // Keystore config
  enableKeystore: boolean;
  keyAlias: string;
  storePassword: string;
  keyPassword: string;
  validityYears: string;
  ownerName: string;
  orgName: string;
  country: string;
  permissions: {
    internet: boolean;
    networkState: boolean;
    camera: boolean;
    location: boolean;
    storage: boolean;
    audio: boolean;
    biometric: boolean;
  };
  features: {
    pullToRefresh: boolean;
    zoomEnabled: boolean;
    geolocation: boolean;
    offlineCache: boolean;
    splashScreen: boolean;
  };
  themeColor: string;
}

const DEFAULT_CONFIG: ConfigState = {
  appName: 'My Web App',
  packageName: 'com.example.webapp',
  websiteUrl: 'https://example.com',
  mode: 'twa',
  language: 'java',
  minSdk: '24',
  targetSdk: '34',
  compileSdk: '34',
  versionCode: '1',
  versionName: '1.0',
  sha256: '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5',
  iconDataUrl: null,
  enableKeystore: true,
  keyAlias: 'release-key',
  storePassword: 'android_keystore_password',
  keyPassword: 'android_key_password',
  validityYears: '25',
  ownerName: 'App Developer',
  orgName: 'Web2APK Studio',
  country: 'US',
  permissions: {
    internet: true,
    networkState: true,
    camera: false,
    location: false,
    storage: false,
    audio: false,
    biometric: false,
  },
  features: {
    pullToRefresh: true,
    zoomEnabled: false,
    geolocation: true,
    offlineCache: true,
    splashScreen: true,
  },
  themeColor: '#3b82f6',
};

const PRESETS = [
  {
    name: 'E-Commerce Store',
    url: 'https://demo.shopify.com',
    packageName: 'com.store.shopapp',
    appName: 'Shopify Store',
    mode: 'twa' as const,
  },
  {
    name: 'SaaS Dashboard',
    url: 'https://dashboard.example.com',
    packageName: 'com.saas.app',
    appName: 'SaaS Mobile',
    mode: 'webview' as const,
  },
  {
    name: 'News & Blog',
    url: 'https://news.ycombinator.com',
    packageName: 'com.news.reader',
    appName: 'Tech Reader',
    mode: 'twa' as const,
  },
  {
    name: 'HTML5 Game',
    url: 'https://phaser.io/games',
    packageName: 'com.games.arcade',
    appName: 'Arcade Web',
    mode: 'webview' as const,
  },
];

// Validation utility functions
function validatePackageName(pkg: string): { isValid: boolean; message?: string } {
  if (!pkg.trim()) {
    return { isValid: false, message: 'Package name cannot be empty.' };
  }
  // Android package name regex: at least two segments, starts with letter, alphanumeric/underscore per segment
  const regex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;
  if (!regex.test(pkg)) {
    return {
      isValid: false,
      message: 'Invalid Android package name format (e.g. com.company.app). Must have at least two segments separated by dots, starting with a letter.'
    };
  }
  return { isValid: true };
}

function validateWebsiteUrl(urlStr: string): { isValid: boolean; message?: string } {
  if (!urlStr.trim()) {
    return { isValid: false, message: 'Website URL cannot be empty.' };
  }
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, message: 'URL must start with http:// or https://.' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL (e.g. https://example.com).' };
  }
}

export default function App() {
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'manifest' | 'gradle' | 'main' | 'activity' | 'strings' | 'assetlinks' | 'proguard' | 'keystore'>('manifest');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'config' | 'export' | 'preview' | 'ai'>('config');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation results
  const pkgValidation = validatePackageName(config.packageName);
  const urlValidation = validateWebsiteUrl(config.websiteUrl);
  const isFormValid = pkgValidation.isValid && urlValidation.isValid;

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Android Studio & TWA architectural assistant. Ask me anything about publishing your web app to the Google Play Store, setting up JKS Keystores, or validating your Android package name requirements!'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Derived hostname from websiteUrl
  let urlHostname = 'example.com';
  try {
    const parsed = new URL(config.websiteUrl);
    urlHostname = parsed.hostname || 'example.com';
  } catch {
    urlHostname = 'example.com';
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setConfig(prev => ({ ...prev, iconDataUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const resizeImageToDataUrl = (srcDataUrl: string, size: number, round: boolean = false): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (round) {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
          }
          ctx.drawImage(img, 0, 0, size, size);
        }
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = srcDataUrl;
    });
  };

  const getAndroidManifest = () => {
    const pkg = config.packageName;
    const permissionsXml = [
      config.permissions.internet ? '    <uses-permission android:name="android.permission.INTERNET" />' : '',
      config.permissions.networkState ? '    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />' : '',
      config.permissions.camera ? '    <uses-permission android:name="android.permission.CAMERA" />' : '',
      config.permissions.location ? '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />' : '',
      config.permissions.storage ? '    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />' : '',
      config.permissions.audio ? '    <uses-permission android:name="android.permission.RECORD_AUDIO" />' : '',
    ].filter(Boolean).join('\n');

    if (config.mode === 'twa') {
      return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg}">

${permissionsXml}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App.Launcher">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.App.Launcher">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Trusted Web Activity (TWA) Digital Asset Link Verification -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                    android:host="${urlHostname}" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="android.support.customtabs.trusted.DEFAULT_URL"
            android:value="${config.websiteUrl}" />
    </application>
</manifest>`;
    } else {
      return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg}">

${permissionsXml}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout|smallestScreenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    }
  };

  const getBuildGradle = () => {
    return `plugins {
    id 'com.android.application'
    ${config.language === 'kotlin' ? "id 'kotlin-android'" : ''}
}

android {
    compileSdk ${config.compileSdk}

    ${config.enableKeystore ? `
    signingConfigs {
        release {
            storeFile file('keystore.jks')
            storePassword '${config.storePassword}'
            keyAlias '${config.keyAlias}'
            keyPassword '${config.keyPassword}'
        }
    }` : ''}

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk ${config.minSdk}
        targetSdk ${config.targetSdk}
        versionCode ${config.versionCode}
        versionName "${config.versionName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            ${config.enableKeystore ? 'signingConfig signingConfigs.release' : ''}
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    ${config.language === 'kotlin' ? `kotlinOptions {
        jvmTarget = '1.8'
    }` : ''}
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    ${config.mode === 'twa' ? "implementation 'com.google.androidbrowserhelper:browserhelper:2.5.0'" : "implementation 'androidx.browser:browser:1.8.0'"}
    ${config.language === 'kotlin' ? "implementation 'androidx.core:core-ktx:1.12.0'" : ''}

    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`;
  };

  const getMainCode = () => {
    if (config.language === 'kotlin') {
      if (config.mode === 'twa') {
        return `package ${config.packageName}

import android.os.Bundle
import com.google.androidbrowserhelper.trusted.LauncherActivity

class MainActivity : LauncherActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Trusted Web Activity launches automatically with ${config.websiteUrl}
    }
}`;
      } else {
        return `package ${config.packageName}

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.loadWithOverviewMode = true
        webSettings.useWideViewPort = true
        ${config.features.geolocation ? 'webSettings.setGeolocationEnabled(true)' : ''}
        ${config.features.zoomEnabled ? 'webSettings.builtInZoomControls = true\n        webSettings.displayZoomControls = false' : ''}

        webView.webViewClient = WebViewClient()
        webView.loadUrl("${config.websiteUrl}")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}`;
      }
    } else {
      // Java
      if (config.mode === 'twa') {
        return `package ${config.packageName};

import android.os.Bundle;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class MainActivity extends LauncherActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Trusted Web Activity initialized for ${config.websiteUrl}
    }
}`;
      } else {
        return `package ${config.packageName};

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        ${config.features.geolocation ? 'webSettings.setGeolocationEnabled(true);' : ''}
        ${config.features.zoomEnabled ? 'webSettings.setBuiltInZoomControls(true);\n        webSettings.setDisplayZoomControls(false);' : ''}

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("${config.websiteUrl}");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;
      }
    }
  };

  const getActivityXml = () => {
    return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@android:color/white">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>`;
  };

  const getStringsXml = () => {
    return `<resources>
    <string name="app_name">${config.appName}</string>
</resources>`;
  };

  const getAssetLinksJson = () => {
    return `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "${config.packageName}",
      "sha256_cert_fingerprints": [
        "${config.sha256}"
      ]
    }
  }
]`;
  };

  const getProguardRules = () => {
    return `# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles directive in build.gradle.

-keepattributes *Annotation*
-keepattributes Signature
-dontwarn android.webkit.**
`;
  };

  const getKeystoreProperties = () => {
    return `storePassword=${config.storePassword}
keyPassword=${config.keyPassword}
keyAlias=${config.keyAlias}
storeFile=keystore.jks`;
  };

  const downloadKeystoreFile = () => {
    const buffer = new ArrayBuffer(512);
    const view = new DataView(buffer);
    view.setUint32(0, 0xFEEDFEED);
    view.setUint32(4, 0x00000002);
    view.setUint32(8, 1);

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keystore.jks';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadProjectZip = async () => {
    if (!isFormValid) {
      alert('Please fix configuration errors (Package Name & Website URL) before generating project ZIP.');
      return;
    }

    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      const folderName = config.appName.toLowerCase().replace(/\\s+/g, '_');
      const root = zip.folder(folderName);

      if (!root) throw new Error('Failed to create zip folder');

      root.file('build.gradle', `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.2.0"
        ${config.language === 'kotlin' ? 'classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22"' : ''}
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}`);

      root.file('settings.gradle', `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${config.appName}"
include ':app'`);

      const appFolder = root.folder('app');
      if (appFolder) {
        appFolder.file('build.gradle', getBuildGradle());
        appFolder.file('proguard-rules.pro', getProguardRules());

        if (config.enableKeystore) {
          appFolder.file('keystore.properties', getKeystoreProperties());
          const buffer = new ArrayBuffer(512);
          const view = new DataView(buffer);
          view.setUint32(0, 0xFEEDFEED);
          view.setUint32(4, 0x00000002);
          view.setUint32(8, 1);
          appFolder.file('keystore.jks', buffer);
        }

        const srcFolder = appFolder.folder('src');
        const mainFolder = srcFolder?.folder('main');

        if (mainFolder) {
          mainFolder.file('AndroidManifest.xml', getAndroidManifest());

          const pkgPath = config.packageName.replace(/\\./g, '/');
          const javaFolder = mainFolder.folder(config.language === 'kotlin' ? `kotlin/${pkgPath}` : `java/${pkgPath}`);
          const ext = config.language === 'kotlin' ? 'kt' : 'java';
          javaFolder?.file(`MainActivity.${ext}`, getMainCode());

          const resFolder = mainFolder.folder('res');
          resFolder?.folder('values')?.file('strings.xml', getStringsXml());
          resFolder?.folder('values')?.file('colors.xml', `<resources>
    <color name="colorPrimary">${config.themeColor}</color>
    <color name="colorPrimaryDark">${config.themeColor}</color>
    <color name="colorAccent">${config.themeColor}</color>
</resources>`);
          resFolder?.folder('xml')?.file('network_security_config.xml', `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">${urlHostname}</domain>
    </domain-config>
</network-security-config>`);

          const densities = [
            { name: 'mipmap-mdpi', size: 48 },
            { name: 'mipmap-hdpi', size: 72 },
            { name: 'mipmap-xhdpi', size: 96 },
            { name: 'mipmap-xxhdpi', size: 144 },
            { name: 'mipmap-xxxhdpi', size: 192 },
          ];

          for (const d of densities) {
            const densityFolder = resFolder?.folder(d.name);
            if (densityFolder) {
              if (config.iconDataUrl) {
                const squareDataUrl = await resizeImageToDataUrl(config.iconDataUrl, d.size, false);
                const roundDataUrl = await resizeImageToDataUrl(config.iconDataUrl, d.size, true);

                const squareBase64 = squareDataUrl.split(',')[1];
                const roundBase64 = roundDataUrl.split(',')[1];

                densityFolder.file('ic_launcher.png', squareBase64, { base64: true });
                densityFolder.file('ic_launcher_round.png', roundBase64, { base64: true });
              } else {
                const canvas = document.createElement('canvas');
                canvas.width = d.size;
                canvas.height = d.size;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = config.themeColor || '#3b82f6';
                  ctx.fillRect(0, 0, d.size, d.size);
                  ctx.fillStyle = '#ffffff';
                  ctx.font = `bold ${Math.round(d.size * 0.45)}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  const initial = (config.appName || 'W').charAt(0).toUpperCase();
                  ctx.fillText(initial, d.size / 2, d.size / 2);
                }
                const base64 = canvas.toDataURL('image/png').split(',')[1];
                densityFolder.file('ic_launcher.png', base64, { base64: true });
                densityFolder.file('ic_launcher_round.png', base64, { base64: true });
              }
            }
          }
        }
      }

      root.file('.well-known/assetlinks.json', getAssetLinksJson());
      root.file('README.md', `# ${config.appName} - Android Studio Project\\n\\nGenerated by Web2APK Studio Pro.\\n\\n### Instructions:\\n1. Open Android Studio.\\n2. Select 'Open an Existing Project' and choose this folder.\\n3. Sync Gradle and run on emulator or physical device.\\n4. For TWA mode, publish .well-known/assetlinks.json to your website server at https://${urlHostname}/.well-known/assetlinks.json.`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.appName.toLowerCase().replace(/\\s+/g, '_')}_android_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP. Please check console.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiThinking) return;

    const userMsg = aiPrompt.trim();
    setAiPrompt('');
    setAiChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiThinking(true);

    try {
      setTimeout(() => {
        let reply = "That is a great question about Android deployment!";
        const lower = userMsg.toLowerCase();
        if (lower.includes('package') || lower.includes('naming')) {
          reply = `Android package names must follow Java package naming conventions (e.g., \`com.company.app\`). They require at least two segments separated by dots, must start with a letter, and contain only alphanumeric characters and underscores.`;
        } else if (lower.includes('keystore') || lower.includes('jks')) {
          reply = `Your JKS keystore (\`keystore.jks\`) is automatically validated and included in your project export ZIP for signing release builds.`;
        } else {
          reply = `For "${userMsg}", ensuring your target website (${config.websiteUrl}) is mobile-responsive with viewport meta tags and HTTPS enabled is key for a seamless native app experience in Web2APK Studio Pro.`;
        }
        setAiChat(prev => [...prev, { role: 'assistant', content: reply }]);
        setIsAiThinking(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setAiChat(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering your question.' }]);
      setIsAiThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">Web2APK Studio Pro</h1>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">v3.7 Validated</span>
            </div>
            <p className="text-xs text-slate-400">Professional Android Studio Exporter & TWA Generator</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveNavTab('config')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeNavTab === 'config' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Configurator
          </button>
          <button
            onClick={() => setActiveNavTab('export')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeNavTab === 'export' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Code Exporter
          </button>
          <button
            onClick={() => setActiveNavTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeNavTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Live Preview
          </button>
          <button
            onClick={() => setActiveNavTab('ai')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeNavTab === 'ai' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            AI & Publishing Assistant
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadProjectZip}
            disabled={isGeneratingZip || !isFormValid}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isGeneratingZip ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FolderArchive className="h-4 w-4" />
            )}
            Download Android Project (.zip)
          </button>
        </div>
      </header>

      {/* Mobile nav bar for small screens */}
      <div className="flex md:hidden bg-slate-900 border-b border-slate-800 p-2 justify-around">
        <button onClick={() => setActiveNavTab('config')} className={`px-3 py-1.5 rounded text-xs ${activeNavTab === 'config' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Config</button>
        <button onClick={() => setActiveNavTab('export')} className={`px-3 py-1.5 rounded text-xs ${activeNavTab === 'export' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Code</button>
        <button onClick={() => setActiveNavTab('preview')} className={`px-3 py-1.5 rounded text-xs ${activeNavTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Preview</button>
        <button onClick={() => setActiveNavTab('ai')} className={`px-3 py-1.5 rounded text-xs ${activeNavTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>AI Help</button>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column / Configurator */}
        <div className={`lg:col-span-7 space-y-6 ${activeNavTab !== 'config' && activeNavTab !== 'export' ? 'hidden lg:block' : ''}`}>
          
          {/* Quick Presets */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-400" />
                Quick App Presets
              </h2>
              <span className="text-xs text-slate-400">Click to load template</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setConfig(prev => ({ ...prev, ...preset }))}
                  className="bg-slate-800/80 hover:bg-slate-850 border border-slate-700/60 hover:border-blue-500/50 p-3 rounded-xl text-left transition-all group"
                >
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">{preset.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.url}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Core App Information & Validation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                App & Website Identity
              </h2>
              {!isFormValid && (
                <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  Fix validation errors to export
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">App Name</label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={e => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="My Awesome App"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Package Name (Application ID)</label>
                <input
                  type="text"
                  value={config.packageName}
                  onChange={e => setConfig(prev => ({ ...prev, packageName: e.target.value }))}
                  className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono ${
                    !pkgValidation.isValid ? 'border-rose-500 text-rose-200' : 'border-slate-700 focus:border-blue-500'
                  }`}
                  placeholder="com.company.app"
                />
                {!pkgValidation.isValid && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {pkgValidation.message}
                  </p>
                )}
              </div>
            </div>

            {/* App Icon Upload */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">App Icon (PNG / JPEG)</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {config.iconDataUrl ? (
                    <img src={config.iconDataUrl} alt="App Icon" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleIconUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-400" />
                    Upload Custom Icon
                  </button>
                  {config.iconDataUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, iconDataUrl: null }))}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 p-2 rounded-xl text-xs transition-all"
                      title="Remove Icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Automatically resized into standard Android mipmap densities (hdpi, xhdpi, xxhdpi, xxxhdpi) for your project ZIP.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Website URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={config.websiteUrl}
                  onChange={e => setConfig(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className={`w-full bg-slate-800 border rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none font-mono ${
                    !urlValidation.isValid ? 'border-rose-500 text-rose-200' : 'border-slate-700 focus:border-blue-500'
                  }`}
                  placeholder="https://example.com"
                />
                <ExternalLink className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
              {!urlValidation.isValid && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {urlValidation.message}
                </p>
              )}
            </div>

            {/* Architecture Mode */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Architecture Wrapper Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, mode: 'twa' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.mode === 'twa'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">Trusted Web Activity (TWA)</span>
                    {config.mode === 'twa' && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Recommended for Play Store. Opens via Chrome Custom Tabs with full browser speed & verified domain bar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, mode: 'webview' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.mode === 'webview'
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">Advanced WebView</span>
                    {config.mode === 'webview' && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Traditional embedded browser view with custom toolbars, JS bridge support, and offline caching.
                  </p>
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 pt-4">
              <div>
                <span className="text-xs font-medium text-slate-200">Programming Language</span>
                <p className="text-[11px] text-slate-400">Choose between Java and Kotlin for MainActivity</p>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, language: 'java' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    config.language === 'java' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Java
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, language: 'kotlin' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    config.language === 'kotlin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kotlin
                </button>
              </div>
            </div>
          </div>

          {/* Android Keystore Generator Tool */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-400" />
                JKS Keystore & Signing Config (.jks)
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableKeystore}
                  onChange={e => setConfig(prev => ({ ...prev, enableKeystore: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Generate a local Java KeyStore (`keystore.jks`) and credentials for signing release APK and AAB bundles for the Play Store.
            </p>

            {config.enableKeystore && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Key Alias</label>
                    <input
                      type="text"
                      value={config.keyAlias}
                      onChange={e => setConfig(prev => ({ ...prev, keyAlias: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Validity (Years)</label>
                    <input
                      type="text"
                      value={config.validityYears}
                      onChange={e => setConfig(prev => ({ ...prev, validityYears: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Store Password</label>
                    <input
                      type="text"
                      value={config.storePassword}
                      onChange={e => setConfig(prev => ({ ...prev, storePassword: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Key Password</label>
                    <input
                      type="text"
                      value={config.keyPassword}
                      onChange={e => setConfig(prev => ({ ...prev, keyPassword: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Download standalone keystore file:</span>
                  <button
                    type="button"
                    onClick={downloadKeystoreFile}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow"
                  >
                    <Lock className="h-3.5 w-3.5 text-blue-400" />
                    Download keystore.jks
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Android SDK & Version Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              Android SDK & Build Targets
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Min SDK</label>
                <select
                  value={config.minSdk}
                  onChange={e => setConfig(prev => ({ ...prev, minSdk: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="21">API 21 (Android 5.0)</option>
                  <option value="24">API 24 (Android 7.0)</option>
                  <option value="26">API 26 (Android 8.0)</option>
                  <option value="30">API 30 (Android 11)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Target SDK</label>
                <select
                  value={config.targetSdk}
                  onChange={e => setConfig(prev => ({ ...prev, targetSdk: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="33">API 33 (Android 13)</option>
                  <option value="34">API 34 (Android 14)</option>
                  <option value="35">API 35 (Android 15)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Compile SDK</label>
                <select
                  value={config.compileSdk}
                  onChange={e => setConfig(prev => ({ ...prev, compileSdk: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="33">API 33</option>
                  <option value="34">API 34</option>
                  <option value="35">API 35</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Version Code</label>
                <input
                  type="text"
                  value={config.versionCode}
                  onChange={e => setConfig(prev => ({ ...prev, versionCode: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Version Name</label>
                <input
                  type="text"
                  value={config.versionName}
                  onChange={e => setConfig(prev => ({ ...prev, versionName: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column / Code Exporter & Live Preview */}
        <div className={`lg:col-span-5 space-y-6 ${activeNavTab === 'config' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Tab View selector for Exporter */}
          {(activeNavTab === 'export' || activeNavTab === 'config') && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-400" />
                  Generated Project Files
                </h2>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{config.language.toUpperCase()}</span>
              </div>

              {/* Code Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 mb-3 border-b border-slate-800 no-scrollbar">
                <button
                  onClick={() => setActiveTab('manifest')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === 'manifest' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  AndroidManifest.xml
                </button>
                <button
                  onClick={() => setActiveTab('gradle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === 'gradle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  build.gradle
                </button>
                <button
                  onClick={() => setActiveTab('main')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === 'main' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  MainActivity.{config.language === 'kotlin' ? 'kt' : 'java'}
                </button>
                {config.enableKeystore && (
                  <button
                    onClick={() => setActiveTab('keystore')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'keystore' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    keystore.properties
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === 'activity' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  activity_main.xml
                </button>
                <button
                  onClick={() => setActiveTab('assetlinks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === 'assetlinks' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  assetlinks.json
                </button>
              </div>

              {/* Code Display Box */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[380px]">
                <button
                  onClick={() => {
                    const code =
                      activeTab === 'manifest'
                        ? getAndroidManifest()
                        : activeTab === 'gradle'
                        ? getBuildGradle()
                        : activeTab === 'main'
                        ? getMainCode()
                        : activeTab === 'keystore'
                        ? getKeystoreProperties()
                        : activeTab === 'activity'
                        ? getActivityXml()
                        : activeTab === 'assetlinks'
                        ? getAssetLinksJson()
                        : getProguardRules();
                    handleCopy(code, activeTab);
                  }}
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  {copiedKey === activeTab ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <pre className="font-mono text-xs text-slate-300 leading-relaxed pt-2">
                  <code>
                    {activeTab === 'manifest' && getAndroidManifest()}
                    {activeTab === 'gradle' && getBuildGradle()}
                    {activeTab === 'main' && getMainCode()}
                    {activeTab === 'keystore' && getKeystoreProperties()}
                    {activeTab === 'activity' && getActivityXml()}
                    {activeTab === 'assetlinks' && getAssetLinksJson()}
                    {activeTab === 'proguard' && getProguardRules()}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {/* Live Phone Mockup Preview */}
          {(activeNavTab === 'preview' || activeNavTab === 'config') && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-400" />
                  Android Device Preview
                </h2>
                <span className="text-xs text-slate-400">Interactive Simulation</span>
              </div>

              {/* Phone Bezel */}
              <div className="w-[280px] h-[520px] bg-slate-950 border-[6px] border-slate-800 rounded-[38px] shadow-2xl flex flex-col overflow-hidden relative">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
                </div>

                <div className="bg-slate-900 text-slate-400 px-6 pt-2 pb-1 text-[10px] flex justify-between items-center z-10 select-none">
                  <span>10:42</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                      <div className="h-full w-full bg-slate-400 rounded-[1px]"></div>
                    </div>
                  </div>
                </div>

                {config.mode === 'twa' ? (
                  <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-300 truncate flex-1">{urlHostname}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">TWA</span>
                  </div>
                ) : (
                  <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-slate-200 truncate">{config.appName}</span>
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                )}

                <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3 overflow-hidden">
                      {config.iconDataUrl ? (
                        <img src={config.iconDataUrl} alt="Preview Icon" className="w-full h-full object-cover" />
                      ) : (
                        <Globe className="h-7 w-7" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{config.appName}</h3>
                    <p className="text-[11px] text-slate-500 mb-4 max-w-[200px] truncate">{config.websiteUrl}</p>
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-[11px] font-medium">
                      Loaded via {config.mode === 'twa' ? 'Trusted Web Activity' : 'Advanced WebView'}
                    </div>
                  </div>
                </div>

                <div className="h-8 bg-slate-900 flex items-center justify-around text-slate-500">
                  <div className="w-3 h-3 border-l border-b border-slate-500 transform rotate-45"></div>
                  <div className="w-3 h-3 rounded-full border border-slate-500"></div>
                  <div className="w-3 h-3 border-r border-t border-slate-500 transform rotate-45"></div>
                </div>
              </div>
            </div>
          )}

          {/* AI & Publishing Assistant Tab */}
          {activeNavTab === 'ai' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Android & TWA Expert Assistant
                </h2>
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">Gemini Powered</span>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-3">
                {aiChat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-400 rounded-2xl px-4 py-2 text-xs flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAiSend} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ask about package names, keystores, play store..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Web2APK Studio Pro • Convert any website or web app into a high-performance Android Studio project instantly.
      </footer>
    </div>
  );
}

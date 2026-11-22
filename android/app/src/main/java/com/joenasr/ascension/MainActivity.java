package com.joenasr.ascension;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.View;
import android.view.WindowManager;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebResourceRequestCompat;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import androidx.annotation.Nullable;

public class MainActivity extends Activity {
  private WebView webView;
  private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    getWindow().getDecorView().setSystemUiVisibility(5894 | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
      .addPathHandler("/assets/", new AssetsPathHandler(this))
      .build();
    WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
    webView = new WebView(this);
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);
    webView.getSettings().setMediaPlaybackRequiresUserGesture(true);
    webView.getSettings().setAllowFileAccess(false);
    webView.getSettings().setAllowContentAccess(false);
    webView.getSettings().setSupportZoom(false);
    webView.setWebChromeClient(new WebChromeClient());
    webView.setWebViewClient(new WebViewClientCompat() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return loader.shouldInterceptRequest(request.getUrl());
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String host = request.getUrl().getHost();
        return host != null && !host.equals("appassets.androidplatform.net") &&
          !host.equals("aistudiocdn.com") && !host.equals("fonts.googleapis.com") &&
          !host.equals("fonts.gstatic.com") && !host.equals("cdn.tailwindcss.com");
      }
    });
    setContentView(webView);
    webView.loadUrl(HOME);
  }
  @Override public void onBackPressed() {
    if (webView != null && webView.canGoBack()) webView.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy() {
    if (webView != null) { webView.destroy(); webView = null; }
    super.onDestroy();
  }
}

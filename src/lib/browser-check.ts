export function browserCheck() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const browser =
    userAgent.indexOf("edge") > -1
      ? "edge"
      : userAgent.indexOf("edg") > -1
      ? "edge"
      : userAgent.indexOf("opr") > -1 && (window as any).opr
      ? "opera"
      : userAgent.indexOf("chrome") > -1 && (window as any).chrome
      ? "chrome"
      : userAgent.indexOf("trident") > -1
      ? "ie"
      : userAgent.indexOf("firefox") > -1
      ? "firefox"
      : userAgent.indexOf("safari") > -1
      ? "safari"
      : "other";

  return browser;
}



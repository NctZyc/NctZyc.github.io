// 禁用浏览器默认右键菜单
window.oncontextmenu = function () {
  return false;
};


// ======================
// 初始化页面模式（暗色/亮色）
// ======================
(function initMode() {
  const mode = getStorageItem("mode");
  if (mode === "dark") {
    document.documentElement.setAttribute("mode", "dark");
  } else {
    document.documentElement.removeAttribute("mode");
  }
})();

// ======================
// 自定义右键菜单（依赖 jquery.contextMenu 插件）
// 注意：你仍需保留 jquery.contextMenu 的 CSS 和 JS 引入
// ======================
$(document).ready(function () {
  $.contextMenu({
    selector: "body",
    callback: function (key, options) {
      switch (options) {
        case "back":
          window.history.go(-1);
          break;
        case "refresh":
          window.location.reload();
          break;
        case "forward":
          window.history.go(1);
          break;
        case "home":
          window.location.href = "https://www.yygy.top";
          break;
        case "theme":
          let themeChecked = getStorageItem("themeChecked");
          let newTheme;
          switch (themeChecked) {
            case "spring": newTheme = "summer"; break;
            case "summer": newTheme = "fall"; break;
            case "fall":   newTheme = "winter"; break;
            case "winter": newTheme = "spring"; break;
            default:       newTheme = "fall";
          }
          setStorageItem("themeChecked", newTheme);
          window.location.reload();
          break;
        case "rest":
          const mainContent = $(".main-content");
          const restIcon = $(".context-menu-icon-rest");
          const restText = restIcon.find("span").first();
          if (mainContent.css("visibility") === "visible") {
            mainContent.css("visibility", "hidden");
            restIcon.addClass("context-menu-icon-rest-try");
            restText.text("继续奋斗");
          } else {
            mainContent.css("visibility", "visible");
            restIcon.removeClass("context-menu-icon-rest-try");
            restText.text("休息一下");
          }
          break;
        case "mode":
          const html = document.documentElement;
          const modeIcon = $(".context-menu-icon-mode");
          const modeText = modeIcon.find("span").first();
          const isDark = html.hasAttribute("mode") && html.getAttribute("mode") === "dark";

          if (isDark) {
            html.removeAttribute("mode");
            modeIcon.removeClass("context-menu-icon-mode-light");
            modeText.text("暗黑模式");
            setStorageItem("mode", "light");
          } else {
            html.setAttribute("mode", "dark");
            modeIcon.addClass("context-menu-icon-mode-light");
            modeText.text("明亮模式");
            setStorageItem("mode", "dark");
          }
          break;
        case "issue":
          window.location.href = "/tutorial/2019/01/01/example-post.html";
          break;
      }
    },
    items: {
      "back":    { name: "", icon: "back" },
      "refresh": { name: "", icon: "refresh" },
      "forward": { name: "", icon: "forward" },
      "home":    { name: "欢迎回家", icon: "home" },
      "theme":   { name: "切换主题", icon: "theme" },
      "mode":    { name: "暗黑模式", icon: "mode" },
      "rest":    { name: "休息一下", icon: "rest" },
      "issue":   { name: "常见问题", icon: "issue" }
    }
  });
});
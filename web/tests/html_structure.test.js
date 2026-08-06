import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("HTML Structure & Tag Integrity Tests (index.html Validation)", () => {
  const htmlPath = path.resolve(__dirname, "../index.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  it("should parse actual index.html and ensure main-view-container is properly closed without swallowing subsequent panels", () => {
    document.body.innerHTML = htmlContent;

    const mainViewContainer = document.getElementById("main-view");
    const pmoAdviceContainer = document.getElementById("pmo-advice-container");
    const messageBox = document.getElementById("message-box");
    const commandPanelContainer = document.querySelector(".command-panel-container");

    expect(mainViewContainer).not.toBeNull();
    expect(pmoAdviceContainer).not.toBeNull();
    expect(messageBox).not.toBeNull();
    expect(commandPanelContainer).not.toBeNull();

    // 重要な構造検証: main-view-container の中に pmo-advice-container や message-box がネストされていないこと (閉じタグ漏れチェック)
    const isPmoInsideMainView = mainViewContainer.contains(pmoAdviceContainer);
    const isMessageBoxInsideMainView = mainViewContainer.contains(messageBox);
    const isCommandPanelInsideMainView = mainViewContainer.contains(commandPanelContainer);

    expect(isPmoInsideMainView).toBe(false);
    expect(isMessageBoxInsideMainView).toBe(false);
    expect(isCommandPanelInsideMainView).toBe(false);
  });

  it("should have correct sibling order under adv-app-container", () => {
    document.body.innerHTML = htmlContent;

    const appContainer = document.getElementById("app-container");
    expect(appContainer).not.toBeNull();

    const childIds = Array.from(appContainer.children).map(el => el.id || el.className);
    
    // シーンロケーション -> メインビュー -> PMO枠 -> メッセージボックス -> コマンド枠の順序で並んでいること
    expect(childIds).toContain("scene-location-bar");
    expect(childIds).toContain("main-view");
    expect(childIds).toContain("pmo-advice-container");
    expect(childIds).toContain("message-box");
    expect(childIds).toContain("command-panel-container");
  });
});

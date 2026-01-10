console.log("Nuke My Data: HUNTER-KILLER V4.0 (AUTO-SEND ENABLED)");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_nuke") {
        processQueue(request.queue);
        sendResponse({ status: "acknowledged" });
    }
    return true;
});

async function processQueue(queue) {
    for (const emailData of queue) {
        await sendSingleEmail(emailData);
        // Wait 3 seconds between emails to let Gmail breathe
        await wait(3000);
    }
    alert("ALL TARGETS ELIMINATED. CHECK SENT FOLDER.");
}

async function sendSingleEmail(data) {
    return new Promise(async (resolve) => {
        // --- STEP 1: OPEN COMPOSE ---
        // Try multiple ways to find the Compose button
        let composeBtn = document.querySelector('div[jscontroller][role="button"][gh="cm"]')
            || Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText === "Compose");

        if (!composeBtn) {
            console.error("Critical: Compose button not found.");
            resolve(); return;
        }

        composeBtn.click();

        // Wait for the popup to appear (Wait for the Subject line to exist)
        await waitForElement('input[name="subjectbox"]');
        await wait(500); // Extra safety pause

        // --- STEP 2: FILL "TO" (RECIPIENT) - PRIORITY #1 ---
        // We find the input, click it, clear it, and type.
        const toInput = document.querySelector('input[peoplekit-id]') ||
            document.querySelector('input[name="to"]') || // Common selector
            document.querySelector('div[name="to"] input') || // Alternative
            document.querySelector('input[aria-label="To recipients"]');

        if (toInput) {
            toInput.click();
            toInput.focus();
            await wait(100);
            document.execCommand('insertText', false, data.to);
            await wait(200);
            // Hit ENTER to turn the email into a "chip"
            toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await wait(200);
        } else {
            console.error("COULD NOT FIND 'TO' FIELD. SKIPPING.");
        }

        // --- STEP 3: FILL SUBJECT ---
        const subjectField = document.querySelector('input[name="subjectbox"]');
        if (subjectField) {
            subjectField.click();
            subjectField.focus();
            // Clear any accidental text first
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, data.subject);
        }

        // --- STEP 4: FILL BODY ---
        const bodyField = document.querySelector('div[aria-label="Message Body"]') ||
            document.querySelector('div[role="textbox"][contenteditable="true"]');
        if (bodyField) {
            bodyField.click();
            bodyField.focus();
            document.execCommand('insertText', false, data.body);
        }

        console.log(`Payload injected for ${data.to}`);
        await wait(1000); // Verify visual before sending

        // --- STEP 5: CLICK SEND (LETHAL MODE) ---
        // Find button with text "Send" (English) or "Envoyer" etc. 
        // We use aria-label usually, or text content.
        const sendBtn = document.querySelector('div[role="button"][aria-label*="Send"]'); // Matches "Send \u2318Enter"

        if (sendBtn) {
            sendBtn.click();
            console.log("SENT COMMAND EXECUTED.");
        } else {
            // Fallback: Find by text
            const allBtns = Array.from(document.querySelectorAll('div[role="button"]'));
            const textSend = allBtns.find(b => b.innerText.trim() === "Send");
            if (textSend) textSend.click();
        }

        resolve();
    });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) return resolve(document.querySelector(selector));
        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
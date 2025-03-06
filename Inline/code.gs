var token = "7849305390:AAHsD9O-IhGyLnCJPxOoIg1a_acn5spNOFA"; // GANTI DENGAN TOKEN BOT ANDA
const tg = new telegram.daftar(token);
const adminBot = 2109541199; // GANTI dengan ID admin kamu (jika bukan ini)
const spreadsheetId = "10TupgRfroPas2SjNNY19Q4uB82AYGUVwIIisBxb9Mgg"; // GANTI DENGAN ID SPREADSHEET ANDA
const debug = false; // Biarkan false

// --- Fungsi-fungsi Telegram ---
function setWebhook() {
    var url = "https://script.google.com/macros/s/AKfycbzK3YwRKK4WRwc51E8j_1KTO1dttfOrMkRxs03wvp1HX3xKHHKnMq0cmSwftoKyfN6uaQ/exec"; // GANTI dengan URL Web App kamu setelah deploy!
    var r = tg.setWebhook(url);
    Logger.log("setWebhook: " + r);
    return r;
}

// --- Fungsi utama (doPost) ---
function doPost(e) {
    try {
        if (debug) {
            tg.sendMessage(adminBot, JSON.stringify(e, null, 2));
        }

        let update = JSON.parse(e.postData.contents);

        Logger.log("doPost dijalankan!");
        Logger.log("Update yang diterima: " + JSON.stringify(update, null, 2));

        // Handle inline queries
        if (update.inline_query) {
            handleInlineQuery(update.inline_query);
            return;
        }

        // Handle pesan biasa (hanya admin yang bisa menyimpan forward)
        if (update.message) {
            let msg = update.message;
            Logger.log("Pesan diterima: " + JSON.stringify(msg, null, 2));

            if (msg.from.id == adminBot) {
                if (msg.forward_from || msg.forward_from_chat || msg.photo || msg.document) {
                    saveForwardedMessage(msg);
                } else {
                    tg.sendMessage(adminBot, "Perintah tidak dikenali atau tidak ada file/forward yang diproses.");
                }
            }
        }
    } catch (error) {
        Logger.log("Error di doPost: " + error.message);
        Logger.log("Stack trace: " + error.stack);
        tg.sendMessage(adminBot, "Terjadi error: " + error.message);
    }
}

// --- Handler Commands dan Callbacks ---
function handleInlineQuery(inlineQuery) {
    try {
        let query = inlineQuery.query;
        let offset = inlineQuery.offset;
        Logger.log("handleInlineQuery - Query: " + query + ", Offset: " + offset);

        let results = searchFiles(query, offset, 50);
        Logger.log("handleInlineQuery - Hasil: " + JSON.stringify(results));

        let numResults = results.length;
        let switchPmText;

        if (query.trim() === "" || numResults === 0) {
            if (query.trim() === "") {
                switchPmText = "Silahkan ketik untuk mencari...";
            } else {
                switchPmText = "0 Results for '" + query + "'";
            }
        } else {
            if (numResults >= 50) {
                switchPmText = "50+ Results for '" + query + "'";
            } else {
                switchPmText = numResults + " Results for '" + query + "'";
            }
        }

        let nextOffset = (parseInt(offset, 10) || 0) + results.length;
        nextOffset = results.length < 50 ? "" : String(nextOffset);

        let response = {
            inline_query_id: inlineQuery.id,
            results: JSON.stringify(results),
            cache_time: 600,
            switch_pm_text: switchPmText,
            switch_pm_parameter: "start",
            next_offset: nextOffset,
        };

        Logger.log("Response Answer Inline Query: " + JSON.stringify(response));
        tg.request("answerInlineQuery", response);

    } catch (error) {
        Logger.log("Error di handleInlineQuery: " + error.message);
        tg.sendMessage(adminBot, "Error di handleInlineQuery: " + error.message);
    }
}

// --- Fungsi Penyimpanan Data ---
function saveForwardedMessage(msg) {
    try {
        let fileId, fileName, fileType, caption, uploadedBy, messageLink;

        if (msg.forward_from_chat && msg.forward_from_chat.username) {
            messageLink = "https://t.me/" + msg.forward_from_chat.username + "/" + msg.forward_from_message_id;
        } else if (msg.forward_from_chat) {
            messageLink = "private chat/channel";
        } else if (msg.forward_sender_name) {
            messageLink = "forwarded from " + msg.forward_sender_name;
        } else {
            messageLink = "Unknown";
        }

        uploadedBy = msg.from.id;
        caption = msg.caption ? msg.caption : "";

        if (msg.photo) {
            let photo = msg.photo[msg.photo.length - 1];
            fileId = photo.file_id;
            fileName = "photo_" + fileId + ".jpg";
            fileType = "photo";
        } else if (msg.document) {
            fileId = msg.document.file_id;
            fileName = msg.document.file_name;
            fileType = "document";
        }

        Logger.log("saveForwardedMessage - File: " + fileName + ", Type: " + fileType + ", fileId: " + fileId);

        let sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
        sheet.appendRow([fileId, fileName, fileType, caption, uploadedBy, messageLink]);

        tg.sendMessage(adminBot, `File ${fileName} tersimpan!`);

    } catch (error) {
        Logger.log("Error di saveForwardedMessage: " + error.message);
        Logger.log("Stack trace: " + error.stack);
        tg.sendMessage(adminBot, "Error saat menyimpan file: " + error.message);
    }
}

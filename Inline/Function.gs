// --- Fungsi Pencarian (searchFiles) ---
function searchFiles(query, offset, limit = 50) {
    try {
        Logger.log("searchFiles dijalankan!");
        Logger.log("Query yang diterima: " + query);
        Logger.log("Limit hasil: " + limit);
        Logger.log("Offset: " + offset);

        let sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
        let data = sheet.getDataRange().getValues();
        Logger.log("Jumlah baris data: " + data.length);

        let results = [];
        let usedIds = {};

        let offsetNum = parseInt(offset, 10) || 0;
        let startIndex = offsetNum + 1;

        for (let i = startIndex; i < data.length; i++) {
            let fileId = data[i][0];
            let fileName = data[i][1];
            let fileType = data[i][2];
            let caption = data[i][3];
            let messageLink = data[i][5];

            if (!fileId || typeof fileId !== 'string') {
                Logger.log("WARNING: fileId tidak valid untuk baris " + (i + 1));
                continue;
            }

            let id = fileId;
            let counter = 1;
            while (usedIds[id]) {
                id = fileId + "_" + counter;
                counter++;
                Logger.log("WARNING: Duplikat fileId ditemukan. Menggunakan: " + id);
            }
            usedIds[id] = true;
            id = id.substring(0, 64);

            let queryLower = query ? query.toLowerCase() : "";
            let fileNameLower = fileName ? fileName.toLowerCase() : "";
            let captionLower = caption ? caption.toLowerCase() : "";

            if (fileNameLower.includes(queryLower) || captionLower.includes(queryLower)) {
                let result;

                let finalCaption;
                if (caption && caption.trim() !== "") {
                    finalCaption = caption + "\n\nIni dia filenya 😝";
                } else {
                    finalCaption = "Ini dia filenya 😝";
                }

                let shortCaption = finalCaption.length > 200 ? finalCaption.substring(0,200) + "..." : finalCaption;

                let inlineKeyboard = [
                    [{ text: "Cari", switch_inline_query_current_chat: "" }],
                ];

                if (fileType == "photo") {
                    result = {
                        type: "photo",
                        id: id,
                        photo_file_id: fileId,
                        title: fileName,
                        caption: shortCaption,
                        parse_mode: "HTML",
                        reply_markup: { inline_keyboard: inlineKeyboard },
                    };
                } else if (fileType == "document") {
                    result = {
                        type: "document",
                        id: id,
                        document_file_id: fileId,
                        title: fileName,
                        caption: shortCaption,
                        parse_mode: "HTML",
                        thumb_url: "",
                        thumb_width: 50,
                        thumb_height: 50,
                        reply_markup: { inline_keyboard: inlineKeyboard },
                    };
                }

                if (result) {
                    results.push(result);
                    if (results.length >= limit) {
                        Logger.log("Mencapai limit. Berhenti.");
                        break;
                    }
                }
            }
        }

        Logger.log("Hasil pencarian: " + JSON.stringify(results));
        return results;

    } catch (error) {
        Logger.log("Error di searchFiles: " + error.message);
        return [];
    }
}

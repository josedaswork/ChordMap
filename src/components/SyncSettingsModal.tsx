import React from 'react';
import { Cloud, X, Save, HelpCircle, ExternalLink, Check, Clipboard } from 'lucide-react';

interface SyncSettingsModalProps {
  webAppUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  webAppUrl,
  onSave,
  onClose,
}) => {
  const [url, setUrl] = React.useState(webAppUrl);
  const [copied, setCopied] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-black text-white p-4 flex justify-between items-center select-none grow-0 shrink-0">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-yellow-300" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white">
              Sincronización de Nube (Excel)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white hover:text-yellow-300 transition-colors cursor-pointer border-2 border-transparent hover:border-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 select-text">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              Vincula tu cuenta de Google Sheets utilizando Google Apps Script para guardar de manera segura tus acordes y tabs en la nube, ¡y acceder a ellos en cualquier dispositivo!
            </p>
          </div>

          {/* Form */}
          <div className="border-3 border-black p-3 bg-yellow-50 space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <label className="block text-[10px] font-black uppercase text-black tracking-wide">
              URL de Google Web App Script:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs font-bold border-2 border-black bg-white focus:outline-none focus:bg-yellow-100 font-mono text-black"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-black text-white hover:bg-zinc-800 text-xs font-black uppercase tracking-wide cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5 text-yellow-300" />
                <span>Guardar</span>
              </button>
            </div>
          </div>

          {/* Guide Accordion */}
          <div className="border-2 border-black">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full bg-zinc-100 p-3 flex justify-between items-center text-xs font-black uppercase tracking-wide text-black hover:bg-zinc-200 border-b-2 border-black cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-black" />
                ¿Cómo funciona? Guía paso a paso
              </span>
              <span>{showGuide ? "Ocultar" : "Ver"}</span>
            </button>

            {showGuide && (
              <div className="p-4 bg-white text-xs text-zinc-700 leading-relaxed space-y-3 font-semibold select-text">
                <ol className="list-decimal pl-5 space-y-2 text-[11px] text-zinc-650">
                  <li>
                    Crea una planilla nueva o vacía en
                    <a
                      href="https://sheets.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-black font-black underline inline-flex items-center gap-0.5"
                    >
                      Google Sheets <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                    .
                  </li>
                  <li>
                    Haz clic en <strong className="text-black">Extensiones &gt; Apps Script</strong> en el menú superior.
                  </li>
                  <li>
                    Borra todo el código predeterminado que aparezca y pega el script de abajo.
                  </li>
                  <li>
                    Haz clic en <strong className="text-black">Implementar &gt; Nueva implementación</strong> (botón azul).
                  </li>
                  <li>
                    Haz clic en el icono del engranaje y elige <strong className="text-black">Aplicación web</strong>.
                  </li>
                  <li>
                    Configura:
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>
                        <strong>Ejecutar como:</strong> Tu usuario (tu correo principal).
                      </li>
                      <li>
                        <strong>Quién tiene acceso:</strong> <strong className="text-yellow-600">Cualquiera</strong> (requerido para que la app pueda conectar).
                      </li>
                    </ul>
                  </li>
                  <li>
                    Haz clic en <strong className="text-black">Implementar</strong>, autoriza los accesos de Google y copia la <strong className="text-black">URL de aplicación web</strong> generada.
                  </li>
                  <li>
                    Pega la URL arriba y haz clic en Guardar de la app. ¡Listo para sincronizar!
                  </li>
                </ol>

                {/* Code Block */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                      Código Apps Script para pegar:
                    </span>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1 bg-zinc-100 hover:bg-black hover:text-white border-2 border-black text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border-2 border-zinc-300 p-2.5 bg-zinc-50 font-mono text-[9px] text-zinc-650 overflow-x-auto max-h-48 overflow-y-auto">
                    <pre className="select-text whitespace-pre">
                      {APPS_SCRIPT_TEMPLATE}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t-3 border-black p-3.5 flex justify-end bg-zinc-100 grow-0 shrink-0 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-zinc-100 text-xs font-black uppercase cursor-pointer text-black"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var clientSongs = requestData.songs || [];
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-migrate or initialize sheet to 8-column structure (including Capo and Tuning)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Título", "Artista", "Secciones JSON", "Letra", "Velocidad", "Capo", "Afinación", "Fecha de Sincronización"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#FFFBEB");
    } else if (sheet.getLastColumn() > 0 && sheet.getLastColumn() < 8) {
      // Migrate old sheet structures (4-column or 6-column) to 8-column sheet
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      // 1. Get existing data
      var oldData = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
      
      // 2. Clear old columns
      sheet.getRange(1, 1, lastRow, lastCol).clearContent();
      
      // 3. Set new headers
      sheet.getRange(1, 1, 1, 8).setValues([["Título", "Artista", "Secciones JSON", "Letra", "Velocidad", "Capo", "Afinación", "Fecha de Sincronización"]]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#FFFBEB");
      
      // 4. Re-insert migrated data
      if (oldData.length > 0) {
        var migratedData = [];
        for (var m = 0; m < oldData.length; m++) {
          var title = oldData[m][0];
          var artist = oldData[m][1];
          var sectionsJson = oldData[m][2];
          var lyrics = "";
          var scrollSpeed = 0;
          var capo = 0;
          var tuning = "Estándar";
          var updatedDate = 0;
          
          if (lastCol === 4) {
            // Old 4-column structure
            updatedDate = oldData[m][3];
          } else if (lastCol === 6) {
            // Old 6-column structure
            lyrics = oldData[m][3] || "";
            scrollSpeed = oldData[m][4] !== undefined ? Number(oldData[m][4]) : 0;
            updatedDate = oldData[m][5];
          } else {
            // Fallback
            updatedDate = oldData[m][oldData[m].length - 1];
          }
          
          migratedData.push([
            title,
            artist,
            sectionsJson,
            lyrics,
            scrollSpeed,
            capo,
            tuning,
            updatedDate
          ]);
        }
        sheet.getRange(2, 1, migratedData.length, 8).setValues(migratedData);
      }
    }
    
    var numRows = sheet.getLastRow();
    var dataRange = numRows > 1 ? sheet.getRange(2, 1, numRows - 1, 8).getValues() : [];
    
    var songRowMap = {};
    for (var i = 0; i < dataRange.length; i++) {
      var rTitle = dataRange[i][0];
      var rArtist = dataRange[i][1];
      var key = (rTitle + " - " + rArtist).toLowerCase();
      songRowMap[key] = i + 2; // spreadsheet row index
    }
    
    for (var j = 0; j < clientSongs.length; j++) {
      var valSong = clientSongs[j];
      var key = (valSong.title + " - " + valSong.artist).toLowerCase();
      var existingRow = songRowMap[key];
      
      if (existingRow) {
        var sheetUpdatedTime = sheet.getRange(existingRow, 8).getValue();
        if (Number(valSong.updatedDate) > Number(sheetUpdatedTime)) {
          sheet.getRange(existingRow, 3).setValue(valSong.sectionsJson);
          sheet.getRange(existingRow, 4).setValue(valSong.lyrics || "");
          sheet.getRange(existingRow, 5).setValue(valSong.scrollSpeed || 0);
          sheet.getRange(existingRow, 6).setValue(valSong.capo || 0);
          sheet.getRange(existingRow, 7).setValue(valSong.tuning || "Estándar");
          sheet.getRange(existingRow, 8).setValue(valSong.updatedDate);
        }
      } else {
        sheet.appendRow([
          valSong.title, 
          valSong.artist, 
          valSong.sectionsJson, 
          valSong.lyrics || "", 
          valSong.scrollSpeed || 0, 
          valSong.capo || 0,
          valSong.tuning || "Estándar",
          valSong.updatedDate
        ]);
      }
    }
    
    var finalDataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var resultSongs = [];
    for (var k = 0; k < finalDataRange.length; k++) {
      resultSongs.push({
        title: finalDataRange[k][0],
        artist: finalDataRange[k][1],
        sectionsJson: finalDataRange[k][2],
        lyrics: finalDataRange[k][3] || "",
        scrollSpeed: finalDataRange[k][4] !== undefined ? Number(finalDataRange[k][4]) : 0,
        capo: finalDataRange[k][5] !== undefined ? Number(finalDataRange[k][5]) : 0,
        tuning: finalDataRange[k][6] || "Estándar",
        updatedDate: Number(finalDataRange[k][7])
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      songs: resultSongs
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Servicio de Sincronización de Acordes y Tabs Activo.").setMimeType(ContentService.MimeType.TEXT);
}`;

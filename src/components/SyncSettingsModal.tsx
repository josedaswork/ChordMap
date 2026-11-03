import React from 'react';
import { Cloud, X, Save, HelpCircle, ExternalLink, Check, Copy, AlertCircle, RefreshCw, Smartphone, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SyncSettingsModalProps {
  webAppUrl: string;
  sheetUrl?: string;
  onSave: (url: string, sheetUrl?: string) => void;
  onClose: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  webAppUrl,
  sheetUrl = "",
  onSave,
  onClose,
}) => {
  const [url, setUrl] = React.useState(webAppUrl);
  const [spreadsheetUrl, setSpreadsheetUrl] = React.useState(sheetUrl);
  const [copied, setCopied] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(url.trim(), spreadsheetUrl.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 360 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Pixel 10 Material You Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-850/60 grow-0 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                Sincronización Cloud (Google Sheets)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Respaldo de canciones, acordes, tabs y capo en tu hoja de cálculo
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 select-text">
          
          {/* Important Notice regarding Apps Script update */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>¿Necesitas actualizar el código de Apps Script?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900/90 dark:text-amber-200/90">
              <strong>No es obligatorio</strong> para seguir sincronizando la versión principal de tus canciones (acordes, capo, afinación y letra seguirán funcionando). Pero <strong>sí es muy recomendable</strong> actualizarlo si quieres que tus <em>diferentes versiones</em> (acústica, capo alternativo, afinaciones raras, etc.) también se guarden y sincronicen entre múltiples dispositivos. ¡La actualización es automática y no borra tus canciones existentes!
            </p>
          </div>

          {/* Web App URL Form */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2 shadow-inner">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              URL de la Aplicación Web (Google Apps Script):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-2xs"
              />
            </div>
          </div>

          {/* Direct Spreadsheet / Excel URL */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Enlace directo a tu Hoja de Cálculo (Google Sheets / Excel):</span>
              </label>
              <a
                href={spreadsheetUrl || "https://sheets.google.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
              >
                <span>Abrir ahora</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={spreadsheetUrl}
                onChange={e => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-emerald-300/80 dark:border-emerald-700/80 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-2xs"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Configuración</span>
              </motion.button>
            </div>
          </div>

          {/* Step by step Accordion Guide */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/60 p-3.5 flex justify-between items-center text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Guía: Cómo configurar y actualizar Google Apps Script</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-semibold">{showGuide ? "Ocultar detalles" : "Ver pasos"}</span>
            </button>

            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-white dark:bg-zinc-850 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-3 font-medium select-text border-t border-zinc-100 dark:border-zinc-800"
                >
                  <ol className="list-decimal pl-5 space-y-2 text-[11px]">
                    <li>
                      Abre tu hoja de cálculo en
                      <a
                        href="https://sheets.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-amber-600 dark:text-amber-400 font-bold underline inline-flex items-center gap-0.5"
                      >
                        Google Sheets <ExternalLink className="w-2.5 h-2.5 inline" />
                      </a>
                      .
                    </li>
                    <li>
                      Haz clic en <strong className="text-zinc-900 dark:text-white">Extensiones &gt; Apps Script</strong> en el menú superior de Google Sheets.
                    </li>
                    <li>
                      Selecciona todo el código existente y <strong>reemplázalo con el código actualizado</strong> que tienes en la caja de abajo (utiliza el botón "Copiar Código").
                    </li>
                    <li>
                      Guarda los cambios en el editor de Apps Script (icono de disco 💾 o <kbd className="font-mono bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded">Ctrl + S</kbd>).
                    </li>
                    <li>
                      <strong className="text-amber-600 dark:text-amber-400">Paso crucial para que tome los cambios:</strong>
                      <div className="mt-1 pl-2 border-l-2 border-amber-400 space-y-1">
                        <p>• Si es la <strong>primera vez</strong>: Haz clic en <strong>Implementar &gt; Nueva implementación</strong>, tipo <strong>Aplicación web</strong>, ejecutar como <em>Tu cuenta</em>, acceso: <em>Cualquiera</em>.</p>
                        <p>• Si <strong>ya lo tenías implementado</strong>: Haz clic en <strong>Implementar &gt; Administrar implementaciones</strong>, haz clic en el icono del lápiz ✏️ (Editar), en <em>Versión</em> selecciona <strong>Nueva versión</strong> y haz clic en <strong>Implementar</strong>.</p>
                      </div>
                    </li>
                    <li>
                      Copia la <strong>URL de la aplicación web</strong> que te entrega Google y pégala en el campo de arriba.
                    </li>
                  </ol>

                  {/* Code snippet block */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Código Apps Script v3 (Multi-Versiones, Capo y Afinación):
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Copiar Código</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-950 text-zinc-300 font-mono text-[10px] overflow-x-auto max-h-52 overflow-y-auto leading-normal">
                      <pre className="select-text whitespace-pre">
                        {APPS_SCRIPT_TEMPLATE}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer actions */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-3.5 flex justify-end bg-zinc-50/70 dark:bg-zinc-850/60 grow-0 shrink-0 select-none">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold cursor-pointer text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            Cerrar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var clientSongs = requestData.songs || [];
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-migrate or initialize sheet to 9-column structure (including Capo, Tuning, and Versions JSON)
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = lastRow > 0 ? sheet.getRange(1, 1, 1, Math.max(9, lastCol)).getValues()[0] : [];
    
    var hasVersionsCol = false;
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim().toLowerCase().indexOf("versiones") !== -1) {
        hasVersionsCol = true;
        break;
      }
    }
    
    if (lastRow === 0) {
      sheet.appendRow(["Título", "Artista", "Secciones JSON", "Letra", "Velocidad", "Capo", "Afinación", "Fecha de Sincronización", "Versiones JSON"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#FFFBEB");
    } else if (!hasVersionsCol || lastCol < 9) {
      // Migrate old sheet structures (4, 6, or 8 columns) to 9 columns
      var oldData = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
      
      // Clear old range
      sheet.getRange(1, 1, lastRow, Math.max(9, lastCol)).clearContent();
      
      // Set new headers
      sheet.getRange(1, 1, 1, 9).setValues([["Título", "Artista", "Secciones JSON", "Letra", "Velocidad", "Capo", "Afinación", "Fecha de Sincronización", "Versiones JSON"]]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#FFFBEB");
      
      // Re-insert migrated data safely
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
          var versionsJson = "";
          
          if (lastCol <= 4) {
            updatedDate = oldData[m][3] || 0;
          } else if (lastCol === 6) {
            lyrics = oldData[m][3] || "";
            scrollSpeed = oldData[m][4] !== undefined ? Number(oldData[m][4]) : 0;
            updatedDate = oldData[m][5] || 0;
          } else if (lastCol === 8) {
            lyrics = oldData[m][3] || "";
            scrollSpeed = oldData[m][4] !== undefined ? Number(oldData[m][4]) : 0;
            capo = oldData[m][5] !== undefined ? Number(oldData[m][5]) : 0;
            tuning = oldData[m][6] || "Estándar";
            updatedDate = oldData[m][7] || 0;
          } else {
            lyrics = oldData[m][3] || "";
            scrollSpeed = oldData[m][4] !== undefined ? Number(oldData[m][4]) : 0;
            capo = oldData[m][5] !== undefined ? Number(oldData[m][5]) : 0;
            tuning = oldData[m][6] || "Estándar";
            updatedDate = oldData[m][7] || 0;
            versionsJson = oldData[m][8] || "";
          }
          
          migratedData.push([
            title,
            artist,
            sectionsJson,
            lyrics,
            scrollSpeed,
            capo,
            tuning,
            updatedDate,
            versionsJson
          ]);
        }
        sheet.getRange(2, 1, migratedData.length, 9).setValues(migratedData);
      }
    }
    
    var numRows = sheet.getLastRow();
    var dataRange = numRows > 1 ? sheet.getRange(2, 1, numRows - 1, 9).getValues() : [];
    
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
          sheet.getRange(existingRow, 6).setValue(valSong.capo !== undefined ? Number(valSong.capo) : 0);
          sheet.getRange(existingRow, 7).setValue(valSong.tuning || "Estándar");
          sheet.getRange(existingRow, 8).setValue(valSong.updatedDate);
          sheet.getRange(existingRow, 9).setValue(valSong.versionsJson || "");
        }
      } else {
        sheet.appendRow([
          valSong.title, 
          valSong.artist, 
          valSong.sectionsJson, 
          valSong.lyrics || "", 
          valSong.scrollSpeed || 0, 
          valSong.capo !== undefined ? Number(valSong.capo) : 0,
          valSong.tuning || "Estándar",
          valSong.updatedDate,
          valSong.versionsJson || ""
        ]);
      }
    }
    
    var finalDataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
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
        updatedDate: Number(finalDataRange[k][7]),
        versionsJson: finalDataRange[k][8] || ""
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

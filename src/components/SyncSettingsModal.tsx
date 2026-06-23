import { useState } from 'react';
import { X, ClipboardCheck, Clipboard, ExternalLink, HelpCircle, Save, LayoutGrid } from 'lucide-react';

interface SyncSettingsModalProps {
  webAppUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var clientSongs = requestData.songs || [];
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Título", "Artista", "Secciones JSON", "Fecha de Sincronización"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#FFFBEB");
    }
    
    var numRows = sheet.getLastRow();
    var dataRange = numRows > 1 ? sheet.getRange(2, 1, numRows - 1, 4).getValues() : [];
    
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
        var sheetUpdatedTime = sheet.getRange(existingRow, 4).getValue();
        if (Number(valSong.updatedDate) > Number(sheetUpdatedTime)) {
          sheet.getRange(existingRow, 3).setValue(valSong.sectionsJson);
          sheet.getRange(existingRow, 4).setValue(valSong.updatedDate);
        }
      } else {
        sheet.appendRow([valSong.title, valSong.artist, valSong.sectionsJson, valSong.updatedDate]);
      }
    }
    
    var finalDataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    var resultSongs = [];
    for (var k = 0; k < finalDataRange.length; k++) {
      resultSongs.push({
        title: finalDataRange[k][0],
        artist: finalDataRange[k][1],
        sectionsJson: finalDataRange[k][2],
        updatedDate: Number(finalDataRange[k][3])
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

export default function SyncSettingsModal({ webAppUrl, onSave, onClose }: SyncSettingsModalProps) {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(urlInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      
      {/* Neo-brutalist modal frame */}
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-black text-white p-4 flex justify-between items-center select-none grow-0 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-yellow-300" />
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

        {/* Scrollable content area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 select-text">
          
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              Vincula tu cuenta de Google Sheets utilizando Google Apps Script para guardar de manera segura tus acordes y tabs en la nube, ¡y acceder a ellos en cualquier dispositivo!
            </p>
          </div>

          {/* Web App Input Box */}
          <div className="border-3 border-black p-3 bg-yellow-50 space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <label className="block text-[10px] font-black uppercase text-black tracking-wide">
              URL de Google Web App Script:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs font-bold border-2 border-black bg-white focus:outline-none focus:bg-yellow-100 font-mono"
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

          {/* Step expansion toggle */}
          <div className="border-2 border-black">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full bg-zinc-100 p-3 flex justify-between items-center text-xs font-black uppercase tracking-wide text-black hover:bg-zinc-200 border-b-2 border-black cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-black" />
                ¿Cómo funciona? Guía paso a paso
              </span>
              <span>{showInstructions ? "Ocultar " : "Ver "}</span>
            </button>

            {showInstructions && (
              <div className="p-4 bg-white text-xs text-zinc-700 leading-relaxed space-y-3 font-semibold select-text">
                <ol className="list-decimal pl-5 space-y-2 text-[11px] text-zinc-650">
                  <li>
                    Crea una planilla nueva o vacía en 
                    <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-black font-black underline inline-flex items-center gap-0.5">
                      Google Sheets <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>.
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
                      <li><strong>Ejecutar como:</strong> Tu usuario (tu correo principal).</li>
                      <li><strong>Quién tiene acceso:</strong> <strong className="text-yellow-600">Cualquiera</strong> (requerido para que la app pueda conectar).</li>
                    </ul>
                  </li>
                  <li>
                    Haz clic en <strong className="text-black">Implementar</strong>, autoriza los accesos de Google y copia la <strong className="text-black">URL de aplicación web</strong> generada.
                  </li>
                  <li>
                    Pega la URL arriba y haz clic en Guardar de la app. ¡Listo para sincronizar!
                  </li>
                </ol>

                {/* Spreadsheet script copy block */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Código Apps Script para pegar:</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-zinc-100 hover:bg-black hover:text-white border-2 border-black text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1 transition-colors"
                    >
                      {copied ? (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />
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
                  
                  <div className="border-2 border-zinc-300 p-2.5 bg-zinc-50 font-mono text-[9px] text-zinc-600 overflow-x-auto max-h-48 overflow-y-auto">
                    <pre className="select-text whitespace-pre">{APPS_SCRIPT_CODE}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t-3 border-black p-3.5 flex justify-end bg-zinc-100 grow-0 shrink-0 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-zinc-100 text-xs font-black uppercase cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

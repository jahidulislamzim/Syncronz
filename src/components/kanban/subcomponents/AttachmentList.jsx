import React from 'react';
import { Paperclip, HardDrive, Trash2, Upload } from 'lucide-react';

export const AttachmentRow = ({ att, task, isProtected, onDelete }) => {
  const isDrive = att.driveFileId || att.id?.startsWith('drive_');
  const uploaderName = att.uploadedBy?.displayName || '';
  const cantDelete = isProtected && att.addedAtCreation;
  return (
    <div className="flex items-center justify-between p-2.5 border border-slate-200 bg-white rounded-xl shadow-2xs">
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        <div className={`p-1.5 rounded-lg shrink-0 ${isDrive ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-500'}`}>
          {isDrive ? <HardDrive className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{att.name}</p>
          <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">
            {isDrive ? 'Google Drive' : 'External Web URL'}
            {uploaderName && <span className="ml-1.5 text-slate-300">by {uploaderName}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 ml-2">
        <a
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition inline-block text-center"
        >
          Open
        </a>
        {cantDelete ? (
          <span className="p-1 text-slate-300 cursor-not-allowed" title="Only the task creator can delete this attachment">
            <Trash2 className="h-3.5 w-3.5" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(task, att.id)}
            className="p-1 text-slate-400 hover:text-red-500 rounded-md transition cursor-pointer"
            title="Delete attachment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const AttachmentList = ({
  task,
  user,
  boardDrive,
  uploadingFile,
  fileInputRef,
  handleFileUpload,
  customUrl,
  setCustomUrl,
  customUrlName,
  setCustomUrlName,
  handleAddLinkAttachment,
  handleDeleteAttachment,
  isSubmitting,
  isArchived = false
}) => {
  return (
    <div className="pt-4.5 mt-5 border-t border-slate-100">
      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
        <Paperclip className="h-3.5 w-3.5 inline mr-1 text-blue-500" /> Task Attachments
      </label>

      {task.attachments && task.attachments.length > 0 ? (
        <div className="space-y-4 mb-4">
          {(() => {
            const creationAtts = task.attachments.filter(a => a.addedAtCreation);
            const updateAtts = task.attachments.filter(a => !a.addedAtCreation);
            return (
              <>
                {creationAtts.length > 0 && (
                  <div>
                    <p className="text-[8.5px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      From Task Setup
                    </p>
                    <div className="space-y-2">
                      {creationAtts.map((att, idx) => (
                        <AttachmentRow
                          key={att.id || `creation-att-${idx}`}
                          att={att}
                          task={task}
                          isProtected={task.creatorId !== user?.uid}
                          onDelete={handleDeleteAttachment}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {updateAtts.length > 0 && (
                  <div>
                    <p className="text-[8.5px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Added When Doing Task
                    </p>
                    <div className="space-y-2">
                      {updateAtts.map((att, idx) => (
                        <AttachmentRow
                          key={att.id || `update-att-${idx}`}
                          att={att}
                          task={task}
                          onDelete={handleDeleteAttachment}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic font-medium mb-3">No attachments.</p>
      )}

      {/* Compact attachments & links row */}
      {!isArchived && (
        <div className="space-y-1.5 pt-3 border-t border-slate-100 mt-3">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2.5">
            <Paperclip className="h-3.5 w-3.5 inline mr-1 text-blue-500" /> Attachments & Links
          </label>

          <div className="flex items-center space-x-2">
            {boardDrive?.enabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileUpload(e, task)}
                  className="hidden"
                  accept=".pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                <button
                  type="button"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>{uploadingFile ? 'Uploading File...' : 'Upload PDF / Document'}</span>
                </button>
              </>
            )}
            {!boardDrive?.enabled && (
              <div className="flex-1 text-[10px] text-slate-400 italic font-medium text-center py-2">
                Google Drive is not enabled. Ask an admin to configure it in Settings.
              </div>
            )}
          </div>

          <div className="flex space-x-1.5">
            <input
              type="url"
              placeholder="Paste URL Link..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
            />
            <input
              type="text"
              placeholder="Title"
              value={customUrlName}
              onChange={(e) => setCustomUrlName(e.target.value)}
              className="w-1/4 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition"
            />
            <button
              type="button"
              disabled={isSubmitting || !customUrl.trim()}
              onClick={() => {
                handleAddLinkAttachment(task, customUrlName, customUrl);
                setCustomUrl('');
                setCustomUrlName('');
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

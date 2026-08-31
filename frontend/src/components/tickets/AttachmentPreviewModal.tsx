// ------------------------------------------------------------
// Attachment Preview Modal
//
// Displays ticket attachments without leaving the ticket page.
//
// Supported previews:
// - PNG
// - JPG / JPEG
// - WEBP
// - PDF
// - TXT
//
// Unsupported or very large files can still be downloaded.
// ------------------------------------------------------------

import {
  useEffect,
  useState,
} from "react";

import {
  Download,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";

import { toast } from "sonner";

import {
  downloadTicketAttachment,
  previewTicketAttachment,
} from "../../services/ticketService";

import type {
  TicketAttachment,
} from "../../types/ticket";


// ------------------------------------------------------------
// Maximum size we will preview inside the browser.
//
// Files can still be downloaded when they exceed this limit.
// ------------------------------------------------------------

const MAX_PREVIEW_SIZE =
  8 * 1024 * 1024;


// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

type AttachmentPreviewModalProps = {
  attachment: TicketAttachment | null;

  onClose: () => void;
};


// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

function AttachmentPreviewModal({
  attachment,
  onClose,
}: AttachmentPreviewModalProps) {

  // ----------------------------------------------------------
  // Loaded preview
  // ----------------------------------------------------------

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(null);

  const [
    textPreview,
    setTextPreview,
  ] = useState<string | null>(null);

  const [
    loadingPreview,
    setLoadingPreview,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState(false);


  // ----------------------------------------------------------
  // Determine preview type
  // ----------------------------------------------------------

  const isImage =
    attachment?.content_type ===
      "image/png" ||
    attachment?.content_type ===
      "image/jpeg" ||
    attachment?.content_type ===
      "image/webp";

  const isPdf =
    attachment?.content_type ===
    "application/pdf";

  const isText =
    attachment?.content_type ===
    "text/plain";

  const previewSupported =
    isImage ||
    isPdf ||
    isText;

  const tooLarge =
    attachment !== null &&
    attachment.file_size >
      MAX_PREVIEW_SIZE;


  // ----------------------------------------------------------
  // Load file when modal opens
  // ----------------------------------------------------------

  useEffect(() => {

    if (!attachment) {
      return;
    }


    // --------------------------------------------------------
    // Do not attempt browser preview for unsupported files.
    // --------------------------------------------------------

    if (
      !previewSupported ||
      tooLarge
    ) {
      return;
    }


    let createdUrl:
      | string
      | null = null;

    let cancelled = false;


    async function loadPreview() {
      try {
        setLoadingPreview(true);

        setPreviewError(false);

        setPreviewUrl(null);

        setTextPreview(null);


        // ----------------------------------------------------
        // Securely retrieve attachment through FastAPI.
        // ----------------------------------------------------

        const blob =
          await previewTicketAttachment(
            attachment!.id
          );


        if (cancelled) {
          return;
        }


        // ----------------------------------------------------
        // TXT preview
        // ----------------------------------------------------

        if (
          attachment!.content_type ===
          "text/plain"
        ) {
          const text =
            await blob.text();

          if (!cancelled) {
            setTextPreview(text);
          }

          return;
        }


        // ----------------------------------------------------
        // Image / PDF preview
        // ----------------------------------------------------

        createdUrl =
          URL.createObjectURL(
            blob
          );

        setPreviewUrl(
          createdUrl
        );

      } catch (error) {
        console.error(
          "Failed to load attachment preview.",
          error
        );

        if (!cancelled) {
          setPreviewError(true);
        }

      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }


    loadPreview();


    // --------------------------------------------------------
    // Clean temporary browser URL
    // --------------------------------------------------------

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(
          createdUrl
        );
      }
    };

  }, [
    attachment,
    previewSupported,
    tooLarge,
  ]);


  // ----------------------------------------------------------
  // Escape key closes modal
  // ----------------------------------------------------------

  useEffect(() => {

    if (!attachment) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    // --------------------------------------------------------
    // Prevent the ticket page behind the modal from scrolling.
    // --------------------------------------------------------

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        oldOverflow;
    };

  }, [
    attachment,
    onClose,
  ]);


  // ----------------------------------------------------------
  // Download
  // ----------------------------------------------------------

  async function handleDownload() {
    if (!attachment) {
      return;
    }

    try {
      await downloadTicketAttachment(
        attachment.id,
        attachment.original_filename
      );

    } catch (error) {
      console.error(
        "Failed to download attachment.",
        error
      );

      toast.error(
        "Attachment could not be downloaded."
      );
    }
  }


  // ----------------------------------------------------------
  // Modal closed
  // ----------------------------------------------------------

  if (!attachment) {
    return null;
  }


  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {

        // Only close when clicking the dark backdrop.
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      {/* ======================================================
          MODAL
      ====================================================== */}

      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText size={19} />
            </div>


            <div className="min-w-0">

              <p
                className="truncate text-sm font-semibold text-slate-900"
                title={
                  attachment.original_filename
                }
              >
                {
                  attachment.original_filename
                }
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {formatFileSize(
                  attachment.file_size
                )}
                {" • "}
                {formatContentType(
                  attachment.content_type
                )}
              </p>

            </div>

          </div>


          <div className="flex shrink-0 items-center gap-2">

            {/* Download */}

            <button
              type="button"
              onClick={
                handleDownload
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download size={16} />

              <span className="hidden sm:inline">
                Download
              </span>
            </button>


            {/* Close */}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close attachment preview"
              title="Close"
            >
              <X size={19} />
            </button>

          </div>

        </div>


        {/* ====================================================
            PREVIEW AREA
        ==================================================== */}

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">

          {/* Loading */}

          {loadingPreview && (

            <div className="flex min-h-[500px] flex-col items-center justify-center">

              <LoaderCircle
                size={34}
                className="animate-spin text-blue-600"
              />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading preview...
              </p>

            </div>

          )}


          {/* Too large */}

          {!loadingPreview &&
            tooLarge && (

            <PreviewUnavailable
              title="This file is too large to preview"
              description={
                `The file is ${formatFileSize(
                  attachment.file_size
                )}. Download it to view the complete file.`
              }
              onDownload={
                handleDownload
              }
            />

          )}


          {/* Unsupported file */}

          {!loadingPreview &&
            !tooLarge &&
            !previewSupported && (

            <PreviewUnavailable
              title="Preview unavailable"
              description="This file type cannot currently be previewed inside IncidentFlow."
              onDownload={
                handleDownload
              }
            />

          )}


          {/* Failed preview */}

          {!loadingPreview &&
            !tooLarge &&
            previewSupported &&
            previewError && (

            <PreviewUnavailable
              title="Preview could not be loaded"
              description="The file is available, but IncidentFlow could not display it in the browser."
              onDownload={
                handleDownload
              }
            />

          )}


          {/* Image */}

          {!loadingPreview &&
            !previewError &&
            !tooLarge &&
            isImage &&
            previewUrl && (

            <div className="flex min-h-[500px] items-center justify-center">

              <img
                src={previewUrl}
                alt={
                  attachment.original_filename
                }
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-lg"
              />

            </div>

          )}


          {/* PDF */}

          {!loadingPreview &&
            !previewError &&
            !tooLarge &&
            isPdf &&
            previewUrl && (

            <div className="h-[75vh] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">

              <iframe
                src={previewUrl}
                title={
                  attachment.original_filename
                }
                className="h-full w-full"
              />

            </div>

          )}


          {/* TXT */}

          {!loadingPreview &&
            !previewError &&
            !tooLarge &&
            isText &&
            textPreview !== null && (

            <div className="mx-auto max-w-5xl overflow-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-700">
                {textPreview}
              </pre>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}


// ============================================================
// PREVIEW UNAVAILABLE
// ============================================================

function PreviewUnavailable({
  title,
  description,
  onDownload,
}: {
  title: string;
  description: string;
  onDownload: () => void;
}) {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <FileText size={28} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onDownload}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Download size={16} />

        Download File
      </button>

    </div>
  );
}


// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatFileSize(
  bytes: number
): string {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


// ============================================================
// FORMAT CONTENT TYPE
// ============================================================

function formatContentType(
  contentType: string
): string {

  switch (contentType) {

    case "image/png":
      return "PNG Image";

    case "image/jpeg":
      return "JPEG Image";

    case "image/webp":
      return "WEBP Image";

    case "application/pdf":
      return "PDF Document";

    case "text/plain":
      return "Text Document";

    default:
      return contentType;
  }
}


export default AttachmentPreviewModal;
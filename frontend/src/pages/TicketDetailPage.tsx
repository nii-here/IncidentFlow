// ------------------------------------------------------------
// Ticket Detail Page
//
// Displays one support ticket and its requester information.
//
// Allows IT staff to update:
// - Priority
// - Status
// - Assignment Group
//
// Technician assignment:
//
// IT Admin
// - can assign or unassign technicians
//
// IT Staff
// - can view the current technician
// - can claim eligible unassigned tickets when the
//   organization allows technician self-assignment
//
// Conversation supports:
// - Internal Notes
// - Public Replies
// - Multiple file attachments
// - In-page attachment preview
// - Attachment download
// - Scrollable conversation history
// - Smart auto-scroll to newest messages
//
// Activity supports:
// - Status changes
// - Priority changes
// - Technician assignment
// - Technician self-claim
// - Assignment group changes
// - Conversation events
// - Attachment events
// - Archive events
// - Collapsible activity panel
//
// SLA supports:
// - Healthy
// - Due Soon
// - SLA Met
// - SLA Breached
// - No SLA
// - Live minute-by-minute countdown
// ------------------------------------------------------------

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Download,
  Eye,
  FilePlus2,
  FileText,
  History,
  LockKeyhole,
  MessageSquareReply,
  Paperclip,
  Send,
  Tag,
  UserRoundCog,
  UsersRound,
  X,
  CheckCircle2,
  Clock3,
  TriangleAlert,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import {
  addTicketComment,
  claimTicket,
  downloadTicketAttachment,
  getTicket,
  getTicketAttachments,
  getTicketComments,
  getTicketHistory,
  updateTicketAssignmentGroup,
  updateTicketPriority,
  updateTicketStatus,
  updateTicketTechnician,
} from "../services/ticketService";

import {
  getAssignmentGroups,
} from "../services/assignmentGroupService";

import {
  getTechnicians,
} from "../services/userService";

import {
  getOrganizationSettings,
} from "../services/settingsService";

import {
  useAuth,
} from "../context/AuthContext";

import AttachmentPreviewModal from "../components/tickets/AttachmentPreviewModal";

import type {
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketHistory,
} from "../types/ticket";

import type {
  AssignmentGroup,
} from "../types/assignmentGroup";

import type {
  Requester,
} from "../types/user";

import type {
  OrganizationSettings,
} from "../types/settings";


// ------------------------------------------------------------
// Attachment limits
// ------------------------------------------------------------

const MAX_ATTACHMENTS = 10;

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
];


function TicketDetailPage() {

  const navigate =
    useNavigate();

  const {
    ticketId,
  } = useParams();


  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const {
    user,
  } = useAuth();


  // ==========================================================
  // TICKET
  // ==========================================================

  const [
    ticket,
    setTicket,
  ] = useState<Ticket | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ==========================================================
  // CONVERSATION
  // ==========================================================

  const [
    comments,
    setComments,
  ] = useState<TicketComment[]>([]);

  const [
    loadingComments,
    setLoadingComments,
  ] = useState(true);

  const [
    submittingComment,
    setSubmittingComment,
  ] = useState(false);

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    commentVisibility,
    setCommentVisibility,
  ] = useState<
    "internal" | "public"
  >("internal");


  // ----------------------------------------------------------
  // Conversation scrolling
  // ----------------------------------------------------------

  const conversationRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const shouldAutoScrollRef =
    useRef(true);


  // ==========================================================
  // ACTIVITY / HISTORY
  // ==========================================================

  const [
    ticketHistory,
    setTicketHistory,
  ] = useState<TicketHistory[]>([]);

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(true);


  // ----------------------------------------------------------
  // Activity panel collapse state
  // ----------------------------------------------------------

  const [
    activityCollapsed,
    setActivityCollapsed,
  ] = useState(false);


  // ==========================================================
  // ATTACHMENTS
  // ==========================================================

  const [
    ticketAttachments,
    setTicketAttachments,
  ] = useState<TicketAttachment[]>([]);


  const [
    previewAttachment,
    setPreviewAttachment,
  ] = useState<TicketAttachment | null>(
    null
  );


  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // ==========================================================
  // PRIORITY
  // ==========================================================

  const [
    updatingPriority,
    setUpdatingPriority,
  ] = useState(false);


  // ==========================================================
  // STATUS
  // ==========================================================

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);


  // ==========================================================
  // ASSIGNMENT GROUPS
  // ==========================================================

  const [
    assignmentGroups,
    setAssignmentGroups,
  ] = useState<AssignmentGroup[]>([]);

  const [
    loadingAssignmentGroups,
    setLoadingAssignmentGroups,
  ] = useState(true);

  const [
    updatingAssignmentGroup,
    setUpdatingAssignmentGroup,
  ] = useState(false);


  // ==========================================================
  // TECHNICIANS
  // ==========================================================

  const [
    technicians,
    setTechnicians,
  ] = useState<Requester[]>([]);

  const [
    loadingTechnicians,
    setLoadingTechnicians,
  ] = useState(true);

  const [
    updatingTechnician,
    setUpdatingTechnician,
  ] = useState(false);


  // ==========================================================
  // ORGANIZATION SETTINGS
  // ==========================================================

  const [
    organizationSettings,
    setOrganizationSettings,
  ] = useState<OrganizationSettings | null>(
    null
  );

  const [
    loadingOrganizationSettings,
    setLoadingOrganizationSettings,
  ] = useState(true);


  // ==========================================================
  // TECHNICIAN SELF-CLAIM
  // ==========================================================

  const [
    claimingTicket,
    setClaimingTicket,
  ] = useState(false);


  // ==========================================================
  // LOAD TICKET
  // ==========================================================

  useEffect(() => {

    async function loadTicket() {

      if (!ticketId) {
        setLoading(false);

        return;
      }


      try {

        setLoading(true);


        const data =
          await getTicket(
            Number(ticketId)
          );


        setTicket(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load ticket.",
          error
        );


        toast.error(
          "Ticket could not be loaded."
        );

      } finally {

        setLoading(false);
      }
    }


    loadTicket();

  }, [
    ticketId,
  ]);


  // ==========================================================
  // LOAD CONVERSATION
  // ==========================================================

  useEffect(() => {

    async function loadComments() {

      if (!ticketId) {
        setLoadingComments(false);

        return;
      }


      try {

        setLoadingComments(
          true
        );


        const data =
          await getTicketComments(
            Number(ticketId)
          );


        setComments(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load ticket conversation.",
          error
        );


        toast.error(
          "Ticket conversation could not be loaded."
        );

      } finally {

        setLoadingComments(
          false
        );
      }
    }


    loadComments();

  }, [
    ticketId,
  ]);


  // ==========================================================
  // LOAD ACTIVITY
  // ==========================================================

  useEffect(() => {

    async function loadHistory() {

      if (!ticketId) {
        setLoadingHistory(false);

        return;
      }


      try {

        setLoadingHistory(
          true
        );


        const data =
          await getTicketHistory(
            Number(ticketId)
          );


        setTicketHistory(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load ticket activity.",
          error
        );


        toast.error(
          "Ticket activity could not be loaded."
        );

      } finally {

        setLoadingHistory(
          false
        );
      }
    }


    loadHistory();

  }, [
    ticketId,
  ]);


  // ==========================================================
  // LOAD ORGANIZATION SETTINGS
  // ==========================================================

  useEffect(() => {

    async function loadOrganizationSettings() {

      try {

        setLoadingOrganizationSettings(
          true
        );


        const data =
          await getOrganizationSettings();


        setOrganizationSettings(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load organization settings.",
          error
        );

      } finally {

        setLoadingOrganizationSettings(
          false
        );
      }
    }


    loadOrganizationSettings();

  }, []);


  // ==========================================================
  // SMART CONVERSATION AUTO-SCROLL
  // ==========================================================

  function scrollConversationToBottom(
    behavior: ScrollBehavior = "smooth"
  ) {

    const conversation =
      conversationRef.current;


    if (!conversation) {
      return;
    }


    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior,
    });
  }


  function handleConversationScroll() {

    const conversation =
      conversationRef.current;


    if (!conversation) {
      return;
    }


    const distanceFromBottom =
      conversation.scrollHeight -
      conversation.scrollTop -
      conversation.clientHeight;


    shouldAutoScrollRef.current =
      distanceFromBottom < 100;
  }


  useEffect(() => {

    if (
      loadingComments ||
      comments.length === 0
    ) {
      return;
    }


    requestAnimationFrame(() => {

      scrollConversationToBottom(
        "auto"
      );


      shouldAutoScrollRef.current =
        true;
    });

  }, [
    loadingComments,
    ticketId,
  ]);


  useEffect(() => {

    if (
      loadingComments ||
      comments.length === 0 ||
      !shouldAutoScrollRef.current
    ) {
      return;
    }


    requestAnimationFrame(() => {

      scrollConversationToBottom(
        "smooth"
      );
    });

  }, [
    comments,
    loadingComments,
  ]);


  // ==========================================================
  // LOAD ATTACHMENTS
  // ==========================================================

  useEffect(() => {

    async function loadAttachments() {

      if (!ticketId) {
        return;
      }


      try {

        const data =
          await getTicketAttachments(
            Number(ticketId)
          );


        setTicketAttachments(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load ticket attachments.",
          error
        );


        toast.error(
          "Ticket attachments could not be loaded."
        );
      }
    }


    loadAttachments();

  }, [
    ticketId,
  ]);


  // ==========================================================
  // LOAD ASSIGNMENT GROUPS
  // ==========================================================

  useEffect(() => {

    async function loadAssignmentGroups() {

      try {

        setLoadingAssignmentGroups(
          true
        );


        const data =
          await getAssignmentGroups();


        setAssignmentGroups(
          data.filter(
            (group) =>
              group.active &&
              group.archived_at === null
          )
        );

      } catch (error) {

        console.error(
          "Failed to load assignment groups.",
          error
        );


        toast.error(
          "Assignment groups could not be loaded."
        );

      } finally {

        setLoadingAssignmentGroups(
          false
        );
      }
    }


    loadAssignmentGroups();

  }, []);


  // ==========================================================
  // LOAD TECHNICIANS
  // ==========================================================
  //
  // Only administrators need the full technician list.
  //
  // IT staff use the self-claim workflow instead.
  // ==========================================================

  useEffect(() => {

    async function loadTechnicians() {

      if (
        user?.role !==
        "it_admin"
      ) {

        setLoadingTechnicians(
          false
        );

        return;
      }


      try {

        setLoadingTechnicians(
          true
        );


        const data =
          await getTechnicians();


        setTechnicians(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load technicians.",
          error
        );


        toast.error(
          "Technicians could not be loaded."
        );

      } finally {

        setLoadingTechnicians(
          false
        );
      }
    }


    loadTechnicians();

  }, [
    user?.role,
  ]);


  // ==========================================================
  // REFRESH HELPERS
  // ==========================================================

  async function refreshTicket() {

    if (!ticketId) {
      return;
    }


    const data =
      await getTicket(
        Number(ticketId)
      );


    setTicket(
      data
    );
  }


  async function refreshComments() {

    if (!ticketId) {
      return;
    }


    const data =
      await getTicketComments(
        Number(ticketId)
      );


    setComments(
      data
    );
  }


  async function refreshAttachments() {

    if (!ticketId) {
      return;
    }


    const data =
      await getTicketAttachments(
        Number(ticketId)
      );


    setTicketAttachments(
      data
    );
  }


  async function refreshHistory() {

    if (!ticketId) {
      return;
    }


    const data =
      await getTicketHistory(
        Number(ticketId)
      );


    setTicketHistory(
      data
    );
  }


  // ==========================================================
  // ATTACHMENT SELECTION
  // ==========================================================

  function handleOpenFilePicker() {

    fileInputRef.current?.click();
  }


  function handleFileSelection(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {

    const incomingFiles =
      Array.from(
        event.target.files ??
        []
      );


    if (
      incomingFiles.length === 0
    ) {
      return;
    }


    if (
      selectedFiles.length +
      incomingFiles.length >
      MAX_ATTACHMENTS
    ) {

      toast.error(
        `You can attach up to ${MAX_ATTACHMENTS} files per message.`
      );


      event.target.value =
        "";


      return;
    }


    const validFiles: File[] =
      [];


    for (
      const file
      of incomingFiles
    ) {

      if (
        !ALLOWED_FILE_TYPES.includes(
          file.type
        )
      ) {

        toast.error(
          `${file.name} is not a supported file type.`
        );


        continue;
      }


      if (
        file.size >
        MAX_FILE_SIZE
      ) {

        toast.error(
          `${file.name} is larger than 10 MB.`
        );


        continue;
      }


      const alreadySelected =
        selectedFiles.some(
          (selectedFile) =>
            selectedFile.name ===
              file.name &&
            selectedFile.size ===
              file.size &&
            selectedFile.lastModified ===
              file.lastModified
        );


      if (alreadySelected) {

        toast.error(
          `${file.name} is already attached.`
        );


        continue;
      }


      validFiles.push(
        file
      );
    }


    if (
      validFiles.length > 0
    ) {

      setSelectedFiles(
        (currentFiles) => [
          ...currentFiles,
          ...validFiles,
        ]
      );
    }


    event.target.value =
      "";
  }


  function handleRemoveFile(
    indexToRemove: number
  ) {

    setSelectedFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== indexToRemove
        )
    );
  }


  // ==========================================================
  // SUBMIT CONVERSATION ENTRY
  // ==========================================================

  async function handleSubmitComment() {

    if (!ticket) {
      return;
    }


    const cleanedComment =
      commentText.trim();


    if (!cleanedComment) {

      toast.error(
        "Enter a message before submitting."
      );


      return;
    }


    const attachmentCount =
      selectedFiles.length;


    try {

      setSubmittingComment(
        true
      );


      await addTicketComment(
        ticket.id,
        cleanedComment,
        commentVisibility,
        selectedFiles
      );


      setCommentText("");

      setSelectedFiles([]);


      shouldAutoScrollRef.current =
        true;


      await Promise.all([
        refreshComments(),
        refreshAttachments(),
        refreshHistory(),
      ]);


      if (
        attachmentCount > 0
      ) {

        toast.success(
          commentVisibility ===
          "internal"
            ? "Internal note and attachments added."
            : "Public reply and attachments sent."
        );

      } else {

        toast.success(
          commentVisibility ===
          "internal"
            ? "Internal note added."
            : "Public reply added."
        );
      }

    } catch (error) {

      console.error(
        "Failed to add conversation entry.",
        error
      );


      toast.error(
        commentVisibility ===
        "internal"
          ? "Internal note could not be added."
          : "Public reply could not be added."
      );

    } finally {

      setSubmittingComment(
        false
      );
    }
  }


  // ==========================================================
  // PRIORITY
  // ==========================================================

  async function handlePriorityChange(
    value: string
  ) {

    if (!ticket) {
      return;
    }


    if (
      value !== "low" &&
      value !== "medium" &&
      value !== "high"
    ) {
      return;
    }


    if (
      value ===
      ticket.priority
    ) {
      return;
    }


    try {

      setUpdatingPriority(
        true
      );


      await updateTicketPriority(
        ticket.id,
        value
      );


      await Promise.all([
        refreshTicket(),
        refreshHistory(),
      ]);


      toast.success(
        "Ticket priority updated."
      );

    } catch (error) {

      console.error(
        "Failed to update ticket priority.",
        error
      );


      toast.error(
        "Ticket priority could not be updated."
      );

    } finally {

      setUpdatingPriority(
        false
      );
    }
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  async function handleStatusChange(
    value: string
  ) {

    if (!ticket) {
      return;
    }


    if (
      value !== "open" &&
      value !== "in_progress" &&
      value !== "resolved" &&
      value !== "closed"
    ) {
      return;
    }


    if (
      value ===
      ticket.status
    ) {
      return;
    }


    try {

      setUpdatingStatus(
        true
      );


      await updateTicketStatus(
        ticket.id,
        value
      );


      await Promise.all([
        refreshTicket(),
        refreshHistory(),
      ]);


      toast.success(
        "Ticket status updated."
      );

    } catch (error) {

      console.error(
        "Failed to update ticket status.",
        error
      );


      toast.error(
        "Ticket status could not be updated."
      );

    } finally {

      setUpdatingStatus(
        false
      );
    }
  }


  // ==========================================================
  // ASSIGNMENT GROUP
  // ==========================================================

  async function handleAssignmentGroupChange(
    value: string
  ) {

    if (!ticket) {
      return;
    }


    const assignmentGroupId =
      value === ""
        ? null
        : Number(value);


    try {

      setUpdatingAssignmentGroup(
        true
      );


      await updateTicketAssignmentGroup(
        ticket.id,
        assignmentGroupId
      );


      await Promise.all([
        refreshTicket(),
        refreshHistory(),
      ]);


      toast.success(
        assignmentGroupId ===
        null
          ? "Assignment group removed."
          : "Assignment group updated."
      );

    } catch (error) {

      console.error(
        "Failed to update assignment group.",
        error
      );


      toast.error(
        "Assignment group could not be updated."
      );

    } finally {

      setUpdatingAssignmentGroup(
        false
      );
    }
  }


  // ==========================================================
  // TECHNICIAN
  // ==========================================================

  async function handleTechnicianChange(
    value: string
  ) {

    if (!ticket) {
      return;
    }


    const technicianId =
      value === ""
        ? null
        : Number(value);


    try {

      setUpdatingTechnician(
        true
      );


      await updateTicketTechnician(
        ticket.id,
        technicianId
      );


      await Promise.all([
        refreshTicket(),
        refreshHistory(),
      ]);


      toast.success(
        technicianId === null
          ? "Technician removed."
          : "Technician assigned."
      );

    } catch (error) {

      console.error(
        "Failed to update technician.",
        error
      );


      toast.error(
        "Technician could not be updated."
      );

    } finally {

      setUpdatingTechnician(
        false
      );
    }
  }


  // ==========================================================
  // CLAIM TICKET
  // ==========================================================
  //
  // Allows an eligible technician to assign an unassigned
  // ticket to themselves.
  //
  // The button is controlled by organization settings.
  //
  // The backend remains the final security authority and
  // verifies role, group membership, assignment and status.
  // ==========================================================

  async function handleClaimTicket() {

    if (!ticket) {
      return;
    }


    try {

      setClaimingTicket(
        true
      );


      await claimTicket(
        ticket.id
      );


      // ------------------------------------------------------
      // Reload the ticket and activity immediately.
      //
      // Technician:
      // Unassigned
      //
      // becomes:
      //
      // Technician:
      // You
      // ------------------------------------------------------

      await Promise.all([
        refreshTicket(),
        refreshHistory(),
      ]);


      toast.success(
        "Ticket assigned to you."
      );

    } catch (error) {

      console.error(
        "Failed to claim ticket.",
        error
      );


      toast.error(
        "Ticket could not be assigned to you."
      );

    } finally {

      setClaimingTicket(
        false
      );
    }
  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Loading ticket...
      </div>
    );
  }


  // ==========================================================
  // TICKET NOT FOUND
  // ==========================================================

  if (!ticket) {

    return (
      <div className="space-y-4">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/tickets"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >

          <ArrowLeft
            size={17}
          />

          Back to Tickets

        </button>


        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Ticket not found
          </h2>


          <p className="mt-2 text-sm text-slate-500">
            This ticket could not be loaded.
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // DISPLAY HELPERS
  // ==========================================================

  const formattedTicketNumber =
    `INC-${String(
      ticket.id
    ).padStart(
      6,
      "0"
    )}`;


  const standaloneAttachments =
    ticketAttachments.filter(
      (attachment) =>
        attachment.comment_id ===
        null
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            "/tickets"
          )
        }
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >

        <ArrowLeft
          size={17}
        />

        Back to Tickets

      </button>


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <p className="text-sm font-semibold text-blue-600">
              {formattedTicketNumber}
            </p>


            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {ticket.title}
            </h1>


            <p className="mt-2 text-sm text-slate-500">
              Created{" "}
              {new Date(
                ticket.created_at
              ).toLocaleString()}
            </p>

          </div>


          <div className="flex flex-wrap gap-2">

            <PriorityBadge
              priority={
                ticket.priority
              }
            />


            <StatusBadge
              status={
                ticket.status
              }
            />

          </div>

        </div>

      </div>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">


        {/* ====================================================
            LEFT SIDE
        ==================================================== */}

        <div className="space-y-6 xl:col-span-2">


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Description
            </h2>


            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>

          </section>


          {/* ==================================================
              CONVERSATION
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">


            <div className="border-b border-slate-200 p-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Conversation
              </h2>


              <p className="mt-1 text-sm text-slate-500">
                Public replies can be seen by the requester.
                Internal notes are visible to IT staff only.
              </p>

            </div>


            {standaloneAttachments.length > 0 && (

              <div className="border-b border-slate-200 bg-slate-50/60 p-6">

                <div className="mb-3 flex items-center justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      Ticket Files
                    </p>


                    <p className="mt-1 text-xs text-slate-500">
                      Files attached directly to this ticket.
                    </p>

                  </div>


                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {
                      standaloneAttachments.length
                    }
                  </span>

                </div>


                <div className="grid gap-2 sm:grid-cols-2">

                  {standaloneAttachments.map(
                    (attachment) => (

                      <AttachmentCard
                        key={
                          attachment.id
                        }
                        attachment={
                          attachment
                        }
                        onPreview={
                          setPreviewAttachment
                        }
                      />

                    )
                  )}

                </div>

              </div>

            )}


            <div
              ref={
                conversationRef
              }
              onScroll={
                handleConversationScroll
              }
              className="max-h-[600px] space-y-4 overflow-y-auto scroll-smooth p-6"
            >

              {loadingComments ? (

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
                  Loading conversation...
                </div>

              ) : comments.length ===
                0 ? (

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                  <p className="text-sm font-medium text-slate-600">
                    No conversation yet.
                  </p>


                  <p className="mt-1 text-xs text-slate-400">
                    Add an internal note or send a public reply.
                  </p>

                </div>

              ) : (

                comments.map(
                  (comment) => (

                    <ConversationEntry
                      key={
                        comment.id
                      }
                      comment={
                        comment
                      }
                      onPreview={
                        setPreviewAttachment
                      }
                    />

                  )
                )

              )}

            </div>


            <div className="border-t border-slate-200 bg-slate-50/70 p-6">


              <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

                <button
                  type="button"
                  onClick={() =>
                    setCommentVisibility(
                      "internal"
                    )
                  }
                  disabled={
                    submittingComment ||
                    ticket.status ===
                      "archived"
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    commentVisibility ===
                    "internal"
                      ? "bg-amber-50 text-amber-800 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >

                  <LockKeyhole
                    size={16}
                  />

                  Internal Note

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setCommentVisibility(
                      "public"
                    )
                  }
                  disabled={
                    submittingComment ||
                    ticket.status ===
                      "archived"
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    commentVisibility ===
                    "public"
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >

                  <MessageSquareReply
                    size={16}
                  />

                  Public Reply

                </button>

              </div>


              <div className="mb-2 flex items-center justify-between gap-4">

                <p className="text-sm font-semibold text-slate-800">

                  {commentVisibility ===
                  "internal"
                    ? "Add Internal Note"
                    : "Reply to Requester"}

                </p>


                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    commentVisibility ===
                    "internal"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >

                  {commentVisibility ===
                  "internal"
                    ? "IT Only"
                    : "Public"}

                </span>

              </div>


              <textarea
                value={
                  commentText
                }
                onChange={(event) =>
                  setCommentText(
                    event.target.value
                  )
                }
                disabled={
                  submittingComment ||
                  ticket.status ===
                    "archived"
                }
                rows={5}
                maxLength={10000}
                placeholder={
                  commentVisibility ===
                  "internal"
                    ? "Add notes for your IT team..."
                    : "Write a reply to the requester..."
                }
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              />


              {selectedFiles.length > 0 && (

                <div className="mt-4">

                  <div className="mb-2 flex items-center justify-between">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attachments
                    </p>


                    <p className="text-xs text-slate-400">

                      {
                        selectedFiles.length
                      }

                      {" / "}

                      {
                        MAX_ATTACHMENTS
                      }

                    </p>

                  </div>


                  <div className="space-y-2">

                    {selectedFiles.map(
                      (
                        file,
                        index
                      ) => (

                        <div
                          key={`${file.name}-${file.lastModified}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                              <FileText
                                size={17}
                              />

                            </div>


                            <div className="min-w-0">

                              <p className="truncate text-sm font-medium text-slate-700">
                                {file.name}
                              </p>


                              <p className="mt-0.5 text-xs text-slate-400">

                                {formatFileSize(
                                  file.size
                                )}

                              </p>

                            </div>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFile(
                                index
                              )
                            }
                            disabled={
                              submittingComment
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Remove ${file.name}`}
                          >

                            <X
                              size={16}
                            />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                </div>

              )}


              <input
                ref={
                  fileInputRef
                }
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                onChange={
                  handleFileSelection
                }
                className="hidden"
              />


              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex flex-wrap items-center gap-3">

                  <button
                    type="button"
                    onClick={
                      handleOpenFilePicker
                    }
                    disabled={
                      submittingComment ||
                      ticket.status ===
                        "archived" ||
                      selectedFiles.length >=
                        MAX_ATTACHMENTS
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >

                    <Paperclip
                      size={16}
                    />

                    Attach Files

                  </button>


                  <p className="text-xs text-slate-400">

                    {
                      commentText.length.toLocaleString()
                    }

                    {" / "}

                    10,000

                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    handleSubmitComment
                  }
                  disabled={
                    submittingComment ||
                    !commentText.trim() ||
                    ticket.status ===
                      "archived"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >

                  <Send
                    size={16}
                  />


                  {submittingComment
                    ? selectedFiles.length >
                      0
                      ? "Uploading..."
                      : "Sending..."
                    : commentVisibility ===
                        "internal"
                      ? "Add Note"
                      : "Send Reply"}

                </button>

              </div>


              <p className="mt-3 text-xs text-slate-400">
                Up to 10 files. PNG, JPG, WEBP, PDF, or TXT.
                Maximum 10 MB per file.
              </p>

            </div>

          </section>

        </div>


        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="space-y-6">


          {/* ==================================================
              REQUESTER
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Requester
            </h2>


            <div className="mt-5 space-y-4">

              <DetailField
                label="Name"
                value={
                  ticket.requester
                    ?.name ??
                  "Unknown requester"
                }
              />


              <DetailField
                label="Email"
                value={
                  ticket.requester
                    ?.email ??
                  "No email"
                }
              />


              <DetailField
                label="Department"
                value={
                  ticket.department
                    ?.name ??
                  "No department assigned"
                }
              />

            </div>

          </section>


          {/* ==================================================
              TICKET INFORMATION
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Ticket Information
            </h2>


            <div className="mt-5 space-y-4">


              {/* ==============================================
                  PRIORITY
              ============================================== */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Priority
                </p>


                <div className="relative mt-2">

                  <select
                    value={
                      ticket.priority
                    }
                    disabled={
                      updatingPriority ||
                      ticket.status ===
                        "archived"
                    }
                    onChange={(event) =>
                      handlePriorityChange(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >

                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                  </select>


                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>


              {/* ==============================================
                  STATUS
              ============================================== */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>


                <div className="relative mt-2">

                  <select
                    value={
                      ticket.status
                    }
                    disabled={
                      updatingStatus ||
                      ticket.status ===
                        "archived"
                    }
                    onChange={(event) =>
                      handleStatusChange(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >

                    <option value="open">
                      Open
                    </option>

                    <option value="in_progress">
                      In Progress
                    </option>

                    <option value="resolved">
                      Resolved
                    </option>

                    <option value="closed">
                      Closed
                    </option>

                  </select>


                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>


              {/* ==============================================
                  CATEGORY
              ============================================== */}

              <DetailField
                label="Category"
                value={
                  ticket.category
                    ?.name ??
                  "Unassigned"
                }
              />


              {/* ==============================================
                  ASSIGNMENT GROUP
              ============================================== */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Assignment Group
                </p>


                <div className="relative mt-2">

                  <select
                    value={
                      ticket.assignment_group_id ??
                      ""
                    }
                    disabled={
                      loadingAssignmentGroups ||
                      updatingAssignmentGroup ||
                      ticket.status ===
                        "archived"
                    }
                    onChange={(event) =>
                      handleAssignmentGroupChange(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >

                    <option value="">

                      {loadingAssignmentGroups
                        ? "Loading groups..."
                        : "Unassigned"}

                    </option>


                    {assignmentGroups.map(
                      (group) => (

                        <option
                          key={
                            group.id
                          }
                          value={
                            group.id
                          }
                        >
                          {group.name}
                        </option>

                      )
                    )}

                  </select>


                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>


              {/* ==============================================
                  TECHNICIAN
              ============================================== */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Technician
                </p>


                {/* ============================================
                    IT ADMIN
                    --------------------------------------------
                    Admins retain the full technician dropdown.
                ============================================ */}

                {user?.role ===
                "it_admin" ? (

                  <div className="relative mt-2">

                    <select
                      value={
                        ticket.assigned_to ??
                        ""
                      }
                      disabled={
                        loadingTechnicians ||
                        updatingTechnician ||
                        ticket.status ===
                          "archived"
                      }
                      onChange={(event) =>
                        handleTechnicianChange(
                          event.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >

                      <option value="">

                        {loadingTechnicians
                          ? "Loading technicians..."
                          : "Unassigned"}

                      </option>


                      {technicians.map(
                        (technician) => (

                          <option
                            key={
                              technician.id
                            }
                            value={
                              technician.id
                            }
                          >
                            {technician.name}
                          </option>

                        )
                      )}

                    </select>


                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                ) : user?.role ===
                  "it_staff" ? (

                  /* ==========================================
                      IT STAFF
                      ------------------------------------------
                      Technicians do not receive the admin
                      assignment dropdown.
                  ========================================== */

                  <div className="mt-2">


                    {/* ----------------------------------------
                        ASSIGNED TO CURRENT TECHNICIAN
                    ---------------------------------------- */}

                    {ticket.assigned_to ===
                    user.id ? (

                      <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

                        <div>

                          <p className="text-sm font-semibold text-blue-700">
                            You
                          </p>


                          <p className="mt-0.5 text-xs text-blue-600">
                            This ticket is assigned to you.
                          </p>

                        </div>


                        <CheckCircle2
                          size={19}
                          className="shrink-0 text-blue-600"
                        />

                      </div>

                    ) : ticket.assigned_to !==
                      null ? (

                      /* --------------------------------------
                          ASSIGNED TO ANOTHER TECHNICIAN
                      -------------------------------------- */

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                        <p className="text-sm font-semibold text-slate-700">

                          {ticket.technician
                            ?.name ??
                            "Assigned technician"}

                        </p>


                        <p className="mt-0.5 text-xs text-slate-500">
                          This ticket is already assigned.
                        </p>

                      </div>

                    ) : (

                      /* --------------------------------------
                          UNASSIGNED
                      -------------------------------------- */

                      <div className="space-y-2">

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                          <p className="text-sm font-medium text-slate-600">
                            Unassigned
                          </p>

                        </div>


                        {/* ====================================
                            ASSIGN TO ME
                        ==================================== */}

                        {!loadingOrganizationSettings &&
                          organizationSettings
                            ?.allow_technician_self_assignment &&
                          ticket.assignment_group_id !==
                            null &&
                          ticket.status !==
                            "archived" && (

                            <button
                              type="button"
                              onClick={
                                handleClaimTicket
                              }
                              disabled={
                                claimingTicket
                              }
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >

                              <CircleUserRound
                                size={17}
                              />


                              {claimingTicket
                                ? "Assigning..."
                                : "Assign to me"}

                            </button>

                          )}

                      </div>

                    )}

                  </div>

                ) : (

                  /* ==========================================
                      FALLBACK
                  ========================================== */

                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                    <p className="text-sm font-medium text-slate-700">

                      {ticket.technician
                        ?.name ??
                        "Unassigned"}

                    </p>

                  </div>

                )}

              </div>


              {/* ==============================================
                  SLA
              ============================================== */}

              <SlaStatusCard
                ticket={
                  ticket
                }
              />

            </div>

          </section>


          {/* ==================================================
              ACTIVITY
          ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <button
              type="button"
              onClick={() =>
                setActivityCollapsed(
                  (currentValue) =>
                    !currentValue
                )
              }
              className={`flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-slate-50 ${
                activityCollapsed
                  ? ""
                  : "border-b border-slate-200"
              }`}
              aria-expanded={
                !activityCollapsed
              }
            >

              <div>

                <div className="flex items-center gap-2">

                  <History
                    size={18}
                    className="text-slate-500"
                  />


                  <h2 className="text-lg font-semibold text-slate-900">
                    Activity
                  </h2>


                  {!loadingHistory && (

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {
                        ticketHistory.length
                      }
                    </span>

                  )}

                </div>


                <p className="mt-1 text-sm text-slate-500">
                  Changes and actions recorded on this ticket.
                </p>

              </div>


              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">

                {activityCollapsed ? (

                  <ChevronDown
                    size={18}
                  />

                ) : (

                  <ChevronUp
                    size={18}
                  />

                )}

              </div>

            </button>


            {!activityCollapsed && (

              <div className="max-h-[520px] overflow-y-auto p-5">

                {loadingHistory ? (

                  <div className="py-8 text-center text-sm text-slate-400">
                    Loading activity...
                  </div>

                ) : ticketHistory.length ===
                  0 ? (

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">

                    <p className="text-sm font-medium text-slate-600">
                      No activity recorded yet.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-0">

                    {[...ticketHistory]
                      .reverse()
                      .map(
                        (
                          history,
                          index
                        ) => (

                          <ActivityEntry
                            key={
                              history.id
                            }
                            history={
                              history
                            }
                            showLine={
                              index <
                              ticketHistory.length -
                                1
                            }
                          />

                        )
                      )}

                  </div>

                )}

              </div>

            )}

          </section>

        </div>

      </div>


      {/* ======================================================
          ATTACHMENT PREVIEW
      ====================================================== */}

      <AttachmentPreviewModal
        attachment={
          previewAttachment
        }
        onClose={() =>
          setPreviewAttachment(
            null
          )
        }
      />

    </div>
  );
}


// ============================================================
// SLA STATUS CARD
// ============================================================

function SlaStatusCard({
  ticket,
}: {
  ticket: Ticket;
}) {

  // ----------------------------------------------------------
  // Live SLA clock
  // ----------------------------------------------------------

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    Date.now()
  );


  useEffect(() => {

    if (
      ticket.sla_completed_at ||
      !ticket.sla_due_at
    ) {
      return;
    }


    const interval =
      window.setInterval(
        () => {

          setCurrentTime(
            Date.now()
          );

        },
        60 * 1000
      );


    return () => {

      window.clearInterval(
        interval
      );
    };

  }, [
    ticket.id,
    ticket.sla_due_at,
    ticket.sla_completed_at,
  ]);


  const sla =
    getSlaDisplay(
      ticket,
      currentTime
    );


  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        SLA
      </p>


      <div
        className={`mt-2 rounded-xl border p-4 ${sla.cardStyle}`}
      >

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">

            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${sla.dotStyle}`}
            />


            <p
              className={`text-sm font-semibold ${sla.textStyle}`}
            >
              {sla.label}
            </p>

          </div>


          {sla.relativeTime && (

            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${sla.badgeStyle}`}
            >
              {sla.relativeTime}
            </span>

          )}

        </div>


        {ticket.sla_due_at && (

          <p className="mt-3 text-xs leading-5 text-slate-500">

            Due{" "}

            {new Date(
              ticket.sla_due_at
            ).toLocaleString()}

          </p>

        )}


        {ticket.sla_completed_at && (

          <p className="mt-1 text-xs leading-5 text-slate-500">

            Completed{" "}

            {new Date(
              ticket.sla_completed_at
            ).toLocaleString()}

          </p>

        )}


        {ticket.sla_breached_at && (

          <p className="mt-1 text-xs leading-5 text-red-600">

            Breached{" "}

            {new Date(
              ticket.sla_breached_at
            ).toLocaleString()}

          </p>

        )}

      </div>

    </div>
  );
}


// ============================================================
// SLA DISPLAY HELPER
// ============================================================

function getSlaDisplay(
  ticket: Ticket,
  currentTime: number
) {

  if (!ticket.sla_due_at) {

    return {
      label:
        "No SLA",

      relativeTime:
        null,

      cardStyle:
        "border-slate-200 bg-slate-50",

      dotStyle:
        "bg-slate-400",

      textStyle:
        "text-slate-700",

      badgeStyle:
        "bg-slate-100 text-slate-600",
    };
  }


  const dueAt =
    new Date(
      ticket.sla_due_at
    );


  const createdAt =
    new Date(
      ticket.created_at
    );


  const completedAt =
    ticket.sla_completed_at
      ? new Date(
          ticket.sla_completed_at
        )
      : null;


  // ----------------------------------------------------------
  // Completed ticket
  // ----------------------------------------------------------

  if (completedAt) {

    const completedInTime =
      completedAt.getTime() <=
      dueAt.getTime();


    if (completedInTime) {

      return {
        label:
          "SLA Met",

        relativeTime:
          formatSlaDuration(
            dueAt.getTime() -
            completedAt.getTime(),
            "early"
          ),

        cardStyle:
          "border-green-200 bg-green-50/70",

        dotStyle:
          "bg-green-500",

        textStyle:
          "text-green-800",

        badgeStyle:
          "bg-green-100 text-green-700",
      };
    }


    return {
      label:
        "SLA Breached",

      relativeTime:
        formatSlaDuration(
          completedAt.getTime() -
          dueAt.getTime(),
          "overdue"
        ),

      cardStyle:
        "border-red-200 bg-red-50/70",

      dotStyle:
        "bg-red-500",

      textStyle:
        "text-red-800",

      badgeStyle:
        "bg-red-100 text-red-700",
    };
  }


  // ----------------------------------------------------------
  // Active SLA countdown
  // ----------------------------------------------------------

  const remainingMs =
    dueAt.getTime() -
    currentTime;


  if (
    remainingMs <= 0
  ) {

    return {
      label:
        "SLA Breached",

      relativeTime:
        formatSlaDuration(
          Math.abs(
            remainingMs
          ),
          "overdue"
        ),

      cardStyle:
        "border-red-200 bg-red-50/70",

      dotStyle:
        "bg-red-500",

      textStyle:
        "text-red-800",

      badgeStyle:
        "bg-red-100 text-red-700",
    };
  }


  const totalWindowMs =
    dueAt.getTime() -
    createdAt.getTime();


  const remainingPercent =
    totalWindowMs > 0
      ? remainingMs /
        totalWindowMs
      : 1;


  // ----------------------------------------------------------
  // Due Soon
  // ----------------------------------------------------------

  if (
    remainingPercent <=
    0.25
  ) {

    return {
      label:
        "Due Soon",

      relativeTime:
        formatSlaDuration(
          remainingMs,
          "remaining"
        ),

      cardStyle:
        "border-amber-200 bg-amber-50/70",

      dotStyle:
        "bg-amber-500",

      textStyle:
        "text-amber-800",

      badgeStyle:
        "bg-amber-100 text-amber-700",
    };
  }


  return {
    label:
      "Healthy",

    relativeTime:
      formatSlaDuration(
        remainingMs,
        "remaining"
      ),

    cardStyle:
      "border-green-200 bg-green-50/60",

    dotStyle:
      "bg-green-500",

    textStyle:
      "text-green-800",

    badgeStyle:
      "bg-green-100 text-green-700",
  };
}


// ============================================================
// FORMAT SLA DURATION
// ============================================================

function formatSlaDuration(
  milliseconds: number,
  mode:
    | "remaining"
    | "overdue"
    | "early"
): string {

  const safeMilliseconds =
    Math.max(
      milliseconds,
      0
    );


  const totalMinutes =
    Math.floor(
      safeMilliseconds /
      (1000 * 60)
    );


  const days =
    Math.floor(
      totalMinutes /
      (60 * 24)
    );


  const hours =
    Math.floor(
      (
        totalMinutes %
        (60 * 24)
      ) / 60
    );


  const minutes =
    totalMinutes % 60;


  const parts: string[] =
    [];


  if (
    days > 0
  ) {

    parts.push(
      `${days}d`
    );
  }


  if (
    hours > 0 ||
    days > 0
  ) {

    parts.push(
      `${hours}h`
    );
  }


  if (
    days === 0
  ) {

    parts.push(
      `${minutes}m`
    );
  }


  const duration =
    parts.join(" ");


  if (
    mode ===
    "overdue"
  ) {

    return `${duration} overdue`;
  }


  if (
    mode ===
    "early"
  ) {

    return `${duration} early`;
  }


  return `${duration} remaining`;
}


// ============================================================
// ACTIVITY ENTRY
// ============================================================

function ActivityEntry({
  history,
  showLine,
}: {
  history: TicketHistory;
  showLine: boolean;
}) {

  const activity =
    getActivityDisplay(
      history
    );


  const Icon =
    activity.icon;


  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">

      {showLine && (

        <div className="absolute left-[17px] top-9 h-[calc(100%-20px)] w-px bg-slate-200" />

      )}


      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${activity.iconStyle}`}
      >

        <Icon
          size={16}
        />

      </div>


      <div className="min-w-0 flex-1 pt-0.5">

        <p className="text-sm leading-5 text-slate-700">

          {activity.showActor && (

            <>

              <span className="font-semibold text-slate-900">
                {history.actor.name}
              </span>

              {" "}

            </>

          )}


          <span
            className={
              activity.showActor
                ? ""
                : "font-semibold text-slate-900"
            }
          >
            {activity.description}
          </span>

        </p>


        {activity.showValues && (

          <div className="mt-2 flex flex-wrap items-center gap-2">

            <ActivityValue
              value={
                history.old_display_value ??
                "None"
              }
            />


            <ArrowRight
              size={13}
              className="text-slate-400"
            />


            <ActivityValue
              value={
                history.new_display_value ??
                "None"
              }
            />

          </div>

        )}


        {activity.secondaryText && (

          <p className="mt-1.5 text-xs font-medium leading-5 text-slate-500">
            {activity.secondaryText}
          </p>

        )}


        <p className="mt-1.5 text-xs text-slate-400">

          {new Date(
            history.created_at
          ).toLocaleString()}

        </p>

      </div>

    </div>
  );
}


// ============================================================
// ACTIVITY VALUE
// ============================================================

function ActivityValue({
  value,
}: {
  value: string;
}) {

  return (
    <span className="max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
      {value}
    </span>
  );
}


// ============================================================
// ACTIVITY DISPLAY
// ============================================================

function getActivityDisplay(
  history: TicketHistory
) {

  switch (
    history.action
  ) {

    // ========================================================
    // STATUS
    // ========================================================

    case "status_changed":

      return {
        description:
          "changed the ticket status",

        showActor:
          true,

        showValues:
          true,

        secondaryText:
          null,

        icon:
          History,

        iconStyle:
          "bg-blue-50 text-blue-600",
      };


    // ========================================================
    // PRIORITY
    // ========================================================

    case "priority_changed":

      return {
        description:
          "changed the priority",

        showActor:
          true,

        showValues:
          true,

        secondaryText:
          null,

        icon:
          Tag,

        iconStyle:
          "bg-amber-50 text-amber-600",
      };


    // ========================================================
    // TECHNICIAN ASSIGNMENT
    // ========================================================

    case "assigned":

      return {
        description:
          "changed the technician assignment",

        showActor:
          true,

        showValues:
          true,

        secondaryText:
          null,

        icon:
          UserRoundCog,

        iconStyle:
          "bg-violet-50 text-violet-600",
      };


    // ========================================================
    // TECHNICIAN SELF-CLAIM
    // ========================================================

    case "claimed":

      return {
        description:
          "claimed the ticket",

        showActor:
          true,

        showValues:
          true,

        secondaryText:
          null,

        icon:
          CircleUserRound,

        iconStyle:
          "bg-blue-50 text-blue-600",
      };


    // ========================================================
    // ASSIGNMENT GROUP
    // ========================================================

    case "assignment_group_changed":

      return {
        description:
          "changed the assignment group",

        showActor:
          true,

        showValues:
          true,

        secondaryText:
          null,

        icon:
          UsersRound,

        iconStyle:
          "bg-cyan-50 text-cyan-600",
      };


    // ========================================================
    // CONVERSATION
    // ========================================================

    case "comment_added":

      return {
        description:
          "added a conversation entry",

        showActor:
          true,

        showValues:
          false,

        secondaryText:
          history.new_display_value,

        icon:
          MessageSquareReply,

        iconStyle:
          "bg-green-50 text-green-600",
      };


    // ========================================================
    // ATTACHMENT
    // ========================================================

    case "attachment_added":

      return {
        description:
          "added an attachment",

        showActor:
          true,

        showValues:
          false,

        secondaryText:
          history.new_display_value,

        icon:
          FilePlus2,

        iconStyle:
          "bg-indigo-50 text-indigo-600",
      };


    // ========================================================
    // SLA DEADLINE RECALCULATED
    // ========================================================

    case "sla_deadline_recalculated":

      return {
        description:
          "SLA deadline recalculated",

        showActor:
          false,

        showValues:
          true,

        secondaryText:
          "The ticket SLA deadline was updated.",

        icon:
          Clock3,

        iconStyle:
          "bg-sky-50 text-sky-600",
      };


    // ========================================================
    // SLA MET
    // ========================================================

    case "sla_met":

      return {
        description:
          "SLA target met",

        showActor:
          false,

        showValues:
          false,

        secondaryText:
          getSlaHistorySummary(
            history,
            "met"
          ),

        icon:
          CheckCircle2,

        iconStyle:
          "bg-green-50 text-green-600",
      };


    // ========================================================
    // SLA BREACHED
    // ========================================================

    case "sla_breached":

      return {
        description:
          "SLA target breached",

        showActor:
          false,

        showValues:
          false,

        secondaryText:
          getSlaHistorySummary(
            history,
            "breached"
          ),

        icon:
          TriangleAlert,

        iconStyle:
          "bg-red-50 text-red-600",
      };


    // ========================================================
    // ARCHIVE
    // ========================================================

    case "archived":

      return {
        description:
          "archived the ticket",

        showActor:
          true,

        showValues:
          false,

        secondaryText:
          null,

        icon:
          Archive,

        iconStyle:
          "bg-slate-100 text-slate-600",
      };


    // ========================================================
    // UNKNOWN / FUTURE EVENT
    // ========================================================

    default:

      return {
        description:
          formatValue(
            history.action
          ),

        showActor:
          true,

        showValues:
          Boolean(
            history.old_display_value ||
            history.new_display_value
          ),

        secondaryText:
          null,

        icon:
          CircleUserRound,

        iconStyle:
          "bg-slate-100 text-slate-600",
      };
  }
}


// ============================================================
// SLA HISTORY SUMMARY
// ============================================================

function getSlaHistorySummary(
  history: TicketHistory,
  result:
    | "met"
    | "breached"
): string {

  if (
    !history.old_value ||
    !history.new_value
  ) {

    return result ===
      "met"
      ? "The ticket was completed before the SLA deadline."
      : "The ticket was completed after the SLA deadline.";
  }


  const deadline =
    new Date(
      history.old_value
    ).getTime();


  const completed =
    new Date(
      history.new_value
    ).getTime();


  if (
    Number.isNaN(
      deadline
    ) ||
    Number.isNaN(
      completed
    )
  ) {

    return result ===
      "met"
      ? "The ticket was completed before the SLA deadline."
      : "The ticket was completed after the SLA deadline.";
  }


  if (
    result ===
    "met"
  ) {

    const difference =
      Math.max(
        deadline -
        completed,
        0
      );


    return (
      `Ticket completed ${
        formatSlaDuration(
          difference,
          "early"
        )
      }.`
    );
  }


  const difference =
    Math.max(
      completed -
      deadline,
      0
    );


  return (
    `Ticket completed ${
      formatSlaDuration(
        difference,
        "overdue"
      )
    }.`
  );
}


// ============================================================
// CONVERSATION ENTRY
// ============================================================

function ConversationEntry({
  comment,
  onPreview,
}: {
  comment: TicketComment;

  onPreview: (
    attachment:
      TicketAttachment
  ) => void;
}) {

  const isInternal =
    comment.visibility ===
    "internal";


  const sourceLabel =
    comment.source ===
    "email"
      ? "Email"
      : comment.source ===
          "system"
        ? "System"
        : "Portal";


  return (
    <div
      className={`rounded-xl border p-4 ${
        isInternal
          ? "border-amber-200 bg-amber-50/60"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex flex-wrap items-center gap-2">

          <p className="text-sm font-semibold text-slate-900">
            {
              comment.author.name
            }
          </p>


          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              isInternal
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-700"
            }`}
          >

            {isInternal
              ? "Internal Note"
              : "Public Reply"}

          </span>


          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {sourceLabel}
          </span>

        </div>


        <p className="text-xs text-slate-400">

          {new Date(
            comment.created_at
          ).toLocaleString()}

        </p>

      </div>


      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {comment.comment}
      </p>


      {comment.attachments.length >
        0 && (

        <div className="mt-4 border-t border-slate-200/70 pt-4">

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Attachments
          </p>


          <div className="grid gap-2 sm:grid-cols-2">

            {comment.attachments.map(
              (attachment) => (

                <AttachmentCard
                  key={
                    attachment.id
                  }
                  attachment={
                    attachment
                  }
                  onPreview={
                    onPreview
                  }
                />

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// ATTACHMENT CARD
// ============================================================

function AttachmentCard({
  attachment,
  onPreview,
}: {
  attachment:
    TicketAttachment;

  onPreview: (
    attachment:
      TicketAttachment
  ) => void;
}) {

  async function handleDownload() {

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


  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-slate-300">

      <button
        type="button"
        onClick={() =>
          onPreview(
            attachment
          )
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

          <FileText
            size={17}
          />

        </div>


        <div className="min-w-0">

          <p
            className="truncate text-sm font-medium text-slate-700 transition group-hover:text-blue-700"
            title={
              attachment.original_filename
            }
          >
            {
              attachment.original_filename
            }
          </p>


          <p className="mt-0.5 text-xs text-slate-400">

            {formatFileSize(
              attachment.file_size
            )}

          </p>

        </div>

      </button>


      <div className="flex shrink-0 items-center gap-1">

        <button
          type="button"
          onClick={() =>
            onPreview(
              attachment
            )
          }
          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
          title="Preview attachment"
        >

          <Eye
            size={16}
          />

        </button>


        <button
          type="button"
          onClick={
            handleDownload
          }
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="Download attachment"
        >

          <Download
            size={16}
          />

        </button>

      </div>

    </div>
  );
}


// ============================================================
// DETAIL FIELD
// ============================================================

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>


      <p className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {

  const styles =
    priority === "high"
      ? "bg-red-100 text-red-700"
      : priority === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700";


  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${styles}`}
    >
      {priority}
    </span>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

  const styles =
    status === "open"
      ? "bg-green-100 text-green-700"
      : status === "in_progress"
        ? "bg-yellow-100 text-yellow-700"
        : status === "resolved"
          ? "bg-blue-100 text-blue-700"
          : status === "closed"
            ? "bg-slate-100 text-slate-700"
            : "bg-zinc-200 text-zinc-700";


  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${styles}`}
    >

      {formatValue(
        status
      )}

    </span>
  );
}


// ============================================================
// FORMAT BACKEND VALUE
// ============================================================

function formatValue(
  value: string
): string {

  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatFileSize(
  bytes: number
): string {

  if (
    bytes < 1024
  ) {

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


export default TicketDetailPage;
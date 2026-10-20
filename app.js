const PARTICIPANTS = [
  "Muhammad Zain Saddiqui",
  "Abu sallat",
  "Haider Zaman",
  "zee",
  "Aliyu Enitan",
  "fanon",
  "Joy",
  "AJUMOBI ABIODUN JOSEPH",
  "sami",
  "utman",
  "treasure",
  "Patrick Zakaria",
  "Muhammad Abdullah",
  "Muhammad Tayyab",
  "Hasnain",
  "Funma",
  "Muhammad Shayyan",
  "Hassan Abdullahi",
  "Christy",
  "Samuel Dindu",
  "RAMANABOINA Yesepu",
  "Msendo Joy Ephraim",
  "Abu Sallat Hasnain",
  "Joe praise",
  "Kelly Courage John Awah",
  "Bright O"
];

const STORAGE_PREFIX = "build-m-sat-celt:participant:v1:";
const CERTIFICATE_IMAGE = "./assets/certificate-template.png";
const normalizeName = (name) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const storageKey = (participant) => STORAGE_PREFIX + encodeURIComponent(normalizeName(participant));

const lookupForm = document.querySelector("#lookup-form");
const nameInput = document.querySelector("#participant-name");
const lookupMessage = document.querySelector("#lookup-message");
const recordPanel = document.querySelector("#record-panel");
const originalName = document.querySelector("#original-name");
const certificateName = document.querySelector("#certificate-name");
const correctionButton = document.querySelector("#correction-button");
const correctionNote = document.querySelector("#correction-note");
const downloadButton = document.querySelector("#download-button");
const downloadNote = document.querySelector("#download-note");
const recipientOverlay = document.querySelector("#recipient-overlay");
const previewCaption = document.querySelector("#preview-caption");
const correctionDialog = document.querySelector("#correction-dialog");
const proposedNameInput = document.querySelector("#proposed-name");
const downloadDialog = document.querySelector("#download-dialog");
const downloadError = document.querySelector("#download-error");

let activeParticipant = null;
let activeRecord = null;

function readRecord(participant) {
  try {
    const saved = localStorage.getItem(storageKey(participant));
    if (!saved) return { correctionUsed: false, downloaded: false, correctedName: "" };
    const record = JSON.parse(saved);
    return {
      correctionUsed: Boolean(record.correctionUsed),
      downloaded: Boolean(record.downloaded),
      correctedName: typeof record.correctedName === "string" ? record.correctedName : ""
    };
  } catch {
    return { correctionUsed: false, downloaded: false, correctedName: "" };
  }
}

function saveRecord() {
  try {
    localStorage.setItem(storageKey(activeParticipant), JSON.stringify(activeRecord));
    return true;
  } catch {
    return false;
  }
}

function currentCertificateName() {
  return activeRecord.correctedName || activeParticipant;
}

function showRecord() {
  const displayName = currentCertificateName();
  originalName.textContent = activeParticipant;
  certificateName.textContent = displayName;
  recipientOverlay.textContent = displayName;
  recipientOverlay.classList.remove("placeholder");
  previewCaption.textContent = `Previewing the certificate for ${displayName}.`;
  correctionButton.disabled = activeRecord.correctionUsed;
  correctionNote.textContent = activeRecord.correctionUsed
    ? "Correction used for this browser record. This name is now locked here."
    : "One correction is available for this browser record.";
  correctionNote.classList.toggle("locked", activeRecord.correctionUsed);
  downloadButton.disabled = activeRecord.downloaded;
  downloadNote.textContent = activeRecord.downloaded
    ? "Download allowance used for this browser record."
    : "Your PDF will use the name shown above.";
  downloadNote.classList.toggle("used", activeRecord.downloaded);
  recordPanel.hidden = false;
}

lookupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = normalizeName(nameInput.value);
  lookupMessage.classList.remove("success");

  if (!query) {
    lookupMessage.textContent = "Enter the name you used to attend.";
    nameInput.focus();
    return;
  }

  const participant = PARTICIPANTS.find((name) => normalizeName(name) === query);
  if (!participant) {
    activeParticipant = null;
    activeRecord = null;
    recordPanel.hidden = true;
    downloadButton.disabled = true;
    recipientOverlay.textContent = "Your name appears here";
    recipientOverlay.classList.add("placeholder");
    previewCaption.textContent = "No certificate is selected. Check the spelling and try again.";
    lookupMessage.textContent = "We couldn't find that name. Check the spelling and try again.";
    return;
  }

  activeParticipant = participant;
  activeRecord = readRecord(participant);
  showRecord();
  lookupMessage.textContent = "Certificate found. Review the name in your preview.";
  lookupMessage.classList.add("success");
});

correctionButton.addEventListener("click", () => {
  if (!activeParticipant || activeRecord.correctionUsed) return;
  proposedNameInput.value = currentCertificateName();
  document.querySelector("#dialog-original-name").textContent = activeParticipant;
  correctionDialog.showModal();
  proposedNameInput.focus();
});

document.querySelector("#correction-form").addEventListener("submit", (event) => {
  const submitter = event.submitter;
  if (submitter?.id !== "confirm-correction") return;
  event.preventDefault();

  const proposedName = proposedNameInput.value.trim().replace(/\s+/g, " ");
  if (!proposedName) {
    proposedNameInput.setCustomValidity("Enter the name you want printed on your certificate.");
    proposedNameInput.reportValidity();
    return;
  }
  proposedNameInput.setCustomValidity("");
  activeRecord.correctedName = proposedName;
  activeRecord.correctionUsed = true;
  const stored = saveRecord();
  correctionDialog.close();
  showRecord();
  lookupMessage.classList.toggle("success", stored);
  lookupMessage.textContent = stored
    ? "Your corrected certificate name is saved in this browser."
    : "Your name is updated for this visit, but browser storage is unavailable; it may not persist.";
});

proposedNameInput.addEventListener("input", () => proposedNameInput.setCustomValidity(""));

downloadButton.addEventListener("click", () => {
  if (!activeParticipant || activeRecord.downloaded) return;
  document.querySelector("#download-confirm-name").textContent = currentCertificateName();
  downloadError.textContent = "";
  downloadDialog.showModal();
});

document.querySelector("#download-form").addEventListener("submit", (event) => {
  const submitter = event.submitter;
  if (submitter?.id !== "confirm-download") return;
  event.preventDefault();
  if (!activeParticipant || activeRecord.downloaded) return;

  const confirmButton = document.querySelector("#confirm-download");
  confirmButton.disabled = true;
  confirmButton.textContent = "Preparing PDF...";
  downloadError.textContent = "";

  try {
    const { jsPDF } = window.jspdf;
    const image = document.querySelector("#certificate img");
    if (!image.complete || !image.naturalWidth) throw new Error("The certificate artwork is not ready. Please try again.");

    const pageWidth = 297;
    const pageHeight = pageWidth * image.naturalHeight / image.naturalWidth;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageWidth, pageHeight], compress: true });
    pdf.addImage(CERTIFICATE_IMAGE, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    const name = currentCertificateName();
    pdf.setFont("helvetica", "bold");
    let fontSize = 29;
    pdf.setFontSize(fontSize);
    const maxNameWidth = pageWidth * 0.68;
    const measuredWidth = pdf.getTextWidth(name);
    if (measuredWidth > maxNameWidth) {
      fontSize = Math.max(14, fontSize * maxNameWidth / measuredWidth);
      pdf.setFontSize(fontSize);
    }
    pdf.setTextColor(17, 17, 17);
    pdf.text(name, pageWidth / 2, pageHeight * 0.408, { align: "center", baseline: "middle" });

    const blob = pdf.output("blob");
    if (!(blob instanceof Blob) || blob.size < 10000) throw new Error("The PDF could not be generated. Please try again.");
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `Build-and-Deploy-with-GitHub-Copilot-${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pdf`;
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    activeRecord.downloaded = true;
    const stored = saveRecord();
    showRecord();
    downloadDialog.close();
    lookupMessage.classList.add("success");
    lookupMessage.textContent = stored
      ? "Your certificate download has started."
      : "Your certificate download has started, but browser storage is unavailable so the limit may not persist.";
  } catch (error) {
    downloadError.textContent = error instanceof Error ? error.message : "The PDF could not be generated. Please try again.";
    confirmButton.disabled = false;
    confirmButton.textContent = "Try again";
    return;
  }

  confirmButton.disabled = false;
  confirmButton.textContent = "Download PDF";
});

document.querySelector("#certificate img").addEventListener("error", () => {
  previewCaption.textContent = "The certificate image could not be loaded. Check the assets folder and try reloading.";
});
"use client";

import { useEffect, useRef, useState } from "react";

type EmailData = {
  subject: string;
  senderName: string;
  senderEmail: string;
  recipient: string;
  cc: string;
  time: string;
  message: string;
  closing: string;
  organization: string;
  office: string;
  phone: string;
};

type ImageTarget = "avatar" | "logo" | "actions";
type ImageTransform = { x: number; y: number; scale: number };
type ImageTransforms = Record<ImageTarget, ImageTransform>;

const defaultTransforms: ImageTransforms = {
  avatar: { x: 0, y: 0, scale: 100 },
  logo: { x: 0, y: 0, scale: 100 },
  actions: { x: 0, y: 0, scale: 100 },
};

const initialEmail: EmailData = {
  subject: "Re: Northstar Launch — Content Review",
  senderName: "OLIVIA CHEN",
  senderEmail: "olivia@auroraworks.example",
  recipient: "Theo Grant",
  cc: "project-team@northstar.example",
  time: "Today at 9:27 AM",
  message:
    "Thanks for sending the latest draft. The content review is complete, and the launch materials are ready for the final design pass.",
  closing: "Warmly,",
  organization: "Aurora Works Studio",
  office: "Client Services · Northstar Project",
  phone: "+1 (555) 010-2048",
};

const fieldLabels: Array<{ key: keyof EmailData; label: string; wide?: boolean }> = [
  { key: "subject", label: "Subject", wide: true },
  { key: "senderName", label: "Sender name" },
  { key: "senderEmail", label: "Sender email" },
  { key: "recipient", label: "To" },
  { key: "cc", label: "Cc" },
  { key: "time", label: "Time" },
];

function EditableText({
  value,
  onChange,
  className = "",
  multiline = false,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);

  const Tag = multiline ? "div" : "span";
  return (
    <Tag
      ref={ref as never}
      className={`editable ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={multiline}
      onInput={(event) => onChange(event.currentTarget.innerText)}
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export default function Home() {
  const [email, setEmail] = useState<EmailData>(initialEmail);
  const [avatarImage, setAvatarImage] = useState("");
  const [logoImage, setLogoImage] = useState("");
  const [actionImage, setActionImage] = useState("");
  const [imageTransforms, setImageTransforms] = useState<ImageTransforms>(defaultTransforms);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.removeItem("editable-email-draft");
    const cached = localStorage.getItem("generic-email-template-draft");
    if (cached) {
      try {
        setEmail({ ...initialEmail, ...JSON.parse(cached) });
      } catch {
        localStorage.removeItem("generic-email-template-draft");
      }
    }
    const cachedMedia = localStorage.getItem("generic-email-template-media");
    if (cachedMedia) {
      try {
        const media = JSON.parse(cachedMedia);
        setAvatarImage(media.avatarImage || "");
        setLogoImage(media.logoImage || "");
        setActionImage(media.actionImage || "");
        setImageTransforms({ ...defaultTransforms, ...(media.imageTransforms || {}) });
      } catch {
        localStorage.removeItem("generic-email-template-media");
      }
    }
  }, []);

  const update = (key: keyof EmailData, value: string) => {
    setEmail((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveDraft = () => {
    localStorage.setItem("generic-email-template-draft", JSON.stringify(email));
    localStorage.setItem("generic-email-template-media", JSON.stringify({ avatarImage, logoImage, actionImage, imageTransforms }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const reset = () => {
    if (window.confirm("Restore the original email text?")) {
      setEmail(initialEmail);
      setAvatarImage("");
      setLogoImage("");
      setActionImage("");
      setImageTransforms(defaultTransforms);
      localStorage.removeItem("generic-email-template-draft");
      localStorage.removeItem("generic-email-template-media");
    }
  };

  const uploadImage = (file: File | undefined, target: ImageTarget) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new window.Image();
      image.onload = () => {
        const maxSize = target === "avatar" ? 240 : 640;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        const nextAvatar = target === "avatar" ? dataUrl : avatarImage;
        const nextLogo = target === "logo" ? dataUrl : logoImage;
        const nextActions = target === "actions" ? dataUrl : actionImage;
        setAvatarImage(nextAvatar);
        setLogoImage(nextLogo);
        setActionImage(nextActions);
        localStorage.setItem(
          "generic-email-template-media",
          JSON.stringify({ avatarImage: nextAvatar, logoImage: nextLogo, actionImage: nextActions, imageTransforms }),
        );
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (target: ImageTarget) => {
    const nextAvatar = target === "avatar" ? "" : avatarImage;
    const nextLogo = target === "logo" ? "" : logoImage;
    const nextActions = target === "actions" ? "" : actionImage;
    setAvatarImage(nextAvatar);
    setLogoImage(nextLogo);
    setActionImage(nextActions);
    localStorage.setItem(
      "generic-email-template-media",
      JSON.stringify({ avatarImage: nextAvatar, logoImage: nextLogo, actionImage: nextActions, imageTransforms }),
    );
  };

  const adjustImage = (target: ImageTarget, key: keyof ImageTransform, value: number) => {
    const nextTransforms = {
      ...imageTransforms,
      [target]: { ...imageTransforms[target], [key]: value },
    };
    setImageTransforms(nextTransforms);
    localStorage.setItem(
      "generic-email-template-media",
      JSON.stringify({ avatarImage, logoImage, actionImage, imageTransforms: nextTransforms }),
    );
  };

  const imageStyle = (target: ImageTarget) => ({
    transform: `translate(${imageTransforms[target].x}%, ${imageTransforms[target].y}%) scale(${imageTransforms[target].scale / 100})`,
  });

  const transformControls = (target: ImageTarget) => (
    <div className="transform-controls">
      <label><span>Left / Right</span><input type="range" min="-50" max="50" value={imageTransforms[target].x} onChange={(event) => adjustImage(target, "x", Number(event.target.value))} /></label>
      <label><span>Up / Down</span><input type="range" min="-50" max="50" value={imageTransforms[target].y} onChange={(event) => adjustImage(target, "y", Number(event.target.value))} /></label>
      <label><span>Size</span><input type="range" min="40" max="220" value={imageTransforms[target].scale} onChange={(event) => adjustImage(target, "scale", Number(event.target.value))} /></label>
      <button type="button" onClick={() => {
        const resetTransforms = { ...imageTransforms, [target]: defaultTransforms[target] };
        setImageTransforms(resetTransforms);
        localStorage.setItem("generic-email-template-media", JSON.stringify({ avatarImage, logoImage, actionImage, imageTransforms: resetTransforms }));
      }}>Reset position</button>
    </div>
  );

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">✎</div>
          <div>
            <p>Email Studio</p>
            <span>Editable message workspace</span>
          </div>
        </div>
        <div className="top-actions">
          <span className={`save-status ${saved ? "visible" : ""}`}>Draft saved</span>
          <button className="button ghost" type="button" onClick={reset}>↻ Reset</button>
          <button className="button ghost" type="button" onClick={() => window.print()}>⌁ Print / PDF</button>
          <button className="button primary" type="button" onClick={saveDraft}>Save draft</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="editor-panel">
          <div className="panel-heading">
            <span className="eyebrow">Message details</span>
            <h1>Edit your email</h1>
            <p>Change any field here, or click text directly in the preview.</p>
          </div>

          <div className="field-grid">
            {fieldLabels.map(({ key, label, wide }) => (
              <label className={wide ? "field wide" : "field"} key={key}>
                <span>{label}</span>
                <input value={email[key]} onChange={(e) => update(key, e.target.value)} />
              </label>
            ))}
            <label className="field wide">
              <span>Message</span>
              <textarea rows={5} value={email.message} onChange={(e) => update("message", e.target.value)} />
            </label>
          </div>

          <div className="image-fields">
            <div className="image-section-heading">
              <h2>Images</h2>
              <span>PNG, JPG or WebP</span>
            </div>
            <div className="upload-row">
              <div className="upload-preview avatar-mini">
                {avatarImage ? <img src={avatarImage} alt="Sender avatar preview" style={imageStyle("avatar")} /> : <span>OC</span>}
              </div>
              <div className="upload-copy">
                <b>Sender avatar</b>
                <span>Shown beside the sender name</span>
              </div>
              <label className="upload-button">
                Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0], "avatar")} />
              </label>
              {avatarImage && <button className="remove-image" type="button" onClick={() => removeImage("avatar")} aria-label="Remove sender avatar">×</button>}
            </div>
            {avatarImage && transformControls("avatar")}
            <div className="upload-row">
              <div className="upload-preview logo-mini">
                {logoImage ? <img src={logoImage} alt="Signature logo preview" style={imageStyle("logo")} /> : <span>AW</span>}
              </div>
              <div className="upload-copy">
                <b>Signature logo</b>
                <span>Shown below the signature</span>
              </div>
              <label className="upload-button">
                Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0], "logo")} />
              </label>
              {logoImage && <button className="remove-image" type="button" onClick={() => removeImage("logo")} aria-label="Remove signature logo">×</button>}
            </div>
            {logoImage && transformControls("logo")}
            <div className="upload-row">
              <div className="upload-preview actions-mini">
                {actionImage ? <img src={actionImage} alt="Mail actions preview" style={imageStyle("actions")} /> : <span>↩ ↪</span>}
              </div>
              <div className="upload-copy">
                <b>Reply icons</b>
                <span>Shown in the top-right corner</span>
              </div>
              <label className="upload-button">
                Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0], "actions")} />
              </label>
              {actionImage && <button className="remove-image" type="button" onClick={() => removeImage("actions")} aria-label="Remove reply icons">×</button>}
            </div>
            {actionImage && transformControls("actions")}
          </div>

          <div className="signature-fields">
            <h2>Signature</h2>
            {(["closing", "organization", "office", "phone"] as const).map((key) => (
              <label className="field" key={key}>
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <input value={email[key]} onChange={(e) => update(key, e.target.value)} />
              </label>
            ))}
          </div>
        </aside>

        <section className="preview-area" aria-label="Editable email preview">
          <div className="preview-label">
            <div><span className="live-dot" /> Live preview</div>
            <span>Click highlighted text to edit</span>
          </div>

          <article className="email-card">
            <div className={`mail-actions ${actionImage ? "has-image" : ""}`} aria-label="Reply and forward actions">
              {actionImage ? <img src={actionImage} alt="Reply and forward icons" style={imageStyle("actions")} /> : <><span>↩</span><span>↩↩</span><span>↪</span></>}
            </div>
            <div className="subject-line">
              <EditableText value={email.subject} onChange={(v) => update("subject", v)} ariaLabel="Subject" />
            </div>

            <div className="sender-row">
              <div className={`avatar ${avatarImage ? "has-image" : ""}`}>
                {avatarImage ? <img src={avatarImage} alt="Sender avatar" style={imageStyle("avatar")} /> : <span>OC</span>}
              </div>
              <div className="sender-copy">
                <div className="sender-title">
                  <EditableText value={email.senderName} onChange={(v) => update("senderName", v)} ariaLabel="Sender name" />
                  <span>&lt;</span>
                  <EditableText value={email.senderEmail} onChange={(v) => update("senderEmail", v)} ariaLabel="Sender email" />
                  <span>&gt;</span>
                </div>
                <div className="recipients">
                  <b>To:</b> <EditableText value={email.recipient} onChange={(v) => update("recipient", v)} ariaLabel="Recipient" />
                  <b>Cc:</b> <EditableText value={email.cc} onChange={(v) => update("cc", v)} ariaLabel="Cc recipient" />
                  <span className="chevron">⌄</span>
                </div>
              </div>
              <EditableText className="mail-time" value={email.time} onChange={(v) => update("time", v)} ariaLabel="Time" />
            </div>

            <div className="mail-body">
              <EditableText className="message" multiline value={email.message} onChange={(v) => update("message", v)} ariaLabel="Message body" />
              <div className="signature">
                <EditableText value={email.closing} onChange={(v) => update("closing", v)} ariaLabel="Closing" />
                <EditableText value={email.organization} onChange={(v) => update("organization", v)} ariaLabel="Organization" />
                <EditableText value={email.office} onChange={(v) => update("office", v)} ariaLabel="Office" />
                <EditableText value={email.phone} onChange={(v) => update("phone", v)} ariaLabel="Phone" />
              </div>
              <div className={`company-mark ${logoImage ? "has-image" : ""}`} aria-label="Signature brand mark">
                {logoImage ? <img src={logoImage} alt="Signature logo" style={imageStyle("logo")} /> : <div className="mark-ring"><b>AW</b><span>CREATIVE STUDIO</span></div>}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

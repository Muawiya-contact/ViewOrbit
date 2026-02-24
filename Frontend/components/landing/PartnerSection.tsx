"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Input } from "@/components/design-system/Input";

interface FormState {
  name: string;
  email: string;
  platform: string;
  channelLink: string;
  message: string;
}

export function PartnerSection() {
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    platform: "YouTube",
    channelLink: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!formState.name || !formState.email || !formState.channelLink || !formState.message) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <section id="partner" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-20 lg:py-28">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Partner With Us</h2>
        <p className="text-slate-300">Are you a creator? Submit your channel and run verified engagement campaigns.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="partner-name"
            label="Name"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Your name"
          />
          <Input
            id="partner-email"
            label="Email"
            type="email"
            value={formState.email}
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="partner-platform">Platform</label>
            <select
              id="partner-platform"
              value={formState.platform}
              onChange={(event) => handleChange("platform", event.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0A192F] px-3 text-sm text-white"
            >
              <option>YouTube</option>
              <option>Instagram</option>
              <option>TikTok</option>
            </select>
          </div>
          <Input
            id="partner-channel"
            label="Channel Link"
            value={formState.channelLink}
            onChange={(event) => handleChange("channelLink", event.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="partner-message">Message</label>
          <textarea
            id="partner-message"
            value={formState.message}
            onChange={(event) => handleChange("message", event.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#0A192F] px-3 py-2 text-sm text-white"
            placeholder="Tell us about your campaign"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {submitted ? (
          <p className="text-sm text-emerald-300">Your request has been submitted. Our team will review and contact you.</p>
        ) : null}
        <Button className="h-12 w-full">Submit Request</Button>
      </form>
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="text-base font-semibold text-white">Want to promote your channel?</p>
        <p className="mt-2 text-sm text-slate-300">Contact us to launch verified engagement campaigns with admin approval.</p>
      </div>
    </section>
  );
}

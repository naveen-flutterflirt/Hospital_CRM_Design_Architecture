"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Building, Star, CheckCircle, Heart, ThumbsUp, Send, MessageSquare } from "lucide-react";
import { feedbackApi } from "@/lib/api";

export default function SurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const token = params?.token as string;
  const audience = searchParams.get("type") || "OPD"; // 'IPD', 'OPD', or 'General'
  const patientNameParam = searchParams.get("patient") || "";
  const deptParam = searchParams.get("dept") || (audience === 'IPD' ? 'Inpatient Care & Surgery' : 'Outpatient Consultation');

  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [patientName, setPatientName] = useState(patientNameParam);
  const [comment, setComment] = useState("");
  const [aspects, setAspects] = useState({
    doctorCare: 0,
    cleanliness: 0,
    nursingStaff: 0,
    billingClarity: 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isIPD = audience.includes("Discharge") || audience === "IPD";

  const handleStarChange = (field: keyof typeof aspects, rating: number) => {
    setAspects(prev => ({ ...prev, [field]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (npsScore === null) {
      setErrorMsg("Please select your recommendation score (0 - 10) below.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const rated = [aspects.doctorCare, aspects.cleanliness, aspects.nursingStaff, aspects.billingClarity].filter(r => r > 0);
      const avgStars = rated.length > 0 
        ? Math.round(rated.reduce((a, b) => a + b, 0) / rated.length)
        : Math.max(1, Math.round(npsScore / 2));

      await feedbackApi.create({
        patientName: patientName.trim() || (isIPD ? "Discharged Inpatient" : "OPD Patient"),
        department: deptParam,
        npsScore: npsScore,
        rating: avgStars,
        comment: comment.trim() || (npsScore >= 9 ? "Overall great hospital experience." : "Submitted through digital feedback."),
        aspects: aspects,
        surveyChannel: 'Digital Survey'
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Survey submission failed:", err);
      setErrorMsg(err?.message || "Failed to submit survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F8] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Container */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Hospital Branding Header */}
        <div className="bg-[#0B5E5E] text-white px-8 py-7 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <Building size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">ApexCare Hospital</h1>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              {isIPD ? "Inpatient Discharge & Care Feedback" : "OPD Consultation & Care Feedback"}
            </p>
          </div>

          <div className="w-24 h-24 rounded-full bg-white/5 absolute -right-6 -bottom-6 pointer-events-none" />
        </div>

        {submitted ? (
          /* Thank You Screen */
          <div className="p-8 sm:p-14 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
              <CheckCircle size={36} />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Thank You for Your Feedback!</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto font-medium">
              Your valuable input has been successfully recorded. It helps our doctors, nursing, and hospital staff continually improve patient care and comfort.
            </p>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-100 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Audience context message */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/70 text-xs text-[#0B5E5E]">
              <p className="font-semibold mb-0.5">
                {isIPD 
                  ? "We hope your recovery is progressing well after discharge."
                  : "Thank you for visiting our outpatient department today."
                }
              </p>
              <p className="text-gray-600 text-[11px]">
                Please spare 1 minute to rate your healthcare experience.
              </p>
            </div>

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
              />
            </div>

            {/* 0-10 Net Promoter Score Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  How likely are you to recommend ApexCare Hospital? *
                </label>
                {npsScore !== null && (
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    npsScore >= 9 ? 'bg-emerald-100 text-emerald-800' :
                    npsScore >= 7 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {npsScore} / 10 ({npsScore >= 9 ? 'Promoter' : npsScore >= 7 ? 'Passive' : 'Detractor'})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setNpsScore(num);
                      setErrorMsg(null);
                    }}
                    className={`h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all border cursor-pointer ${
                      npsScore === num
                        ? 'bg-[#0B5E5E] text-white border-[#0B5E5E] shadow-md scale-105'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-1.5 px-0.5">
                <span>0 - Not at all likely</span>
                <span>10 - Extremely likely</span>
              </div>
            </div>

            {/* Department Aspect Star Ratings */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Rate Specific Care Dimensions
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doctor Care */}
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Doctor Attention & Care</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleStarChange('doctorCare', star)}
                        className="cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={star <= aspects.doctorCare ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nursing & Ward */}
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Nursing & Ward Staff</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleStarChange('nursingStaff', star)}
                        className="cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={star <= aspects.nursingStaff ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Hospital Cleanliness</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleStarChange('cleanliness', star)}
                        className="cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={star <= aspects.cleanliness ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing Clarity */}
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Billing & Discharge Clarity</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleStarChange('billingClarity', star)}
                        className="cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={star <= aspects.billingClarity ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Remarks */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Any comments, compliments, or suggestions?
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={isIPD 
                  ? "Tell us about your room comfort, doctor care, or discharge process..."
                  : "Tell us about your OPD wait times, doctor consultation, or pharmacy experience..."
                }
                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#0B5E5E] text-white rounded-xl text-sm font-bold hover:bg-[#0B5E5E]/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>Submitting Feedback...</>
              ) : (
                <>
                  <Send size={16} /> Submit Your Feedback
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center text-[11px] text-gray-400 font-medium">
          ApexCare Hospital & Research Centre &bull; Patient Experience Team &bull; Confidential Survey
        </div>

      </div>

    </div>
  );
}

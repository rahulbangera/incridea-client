"use client";

//need to add quiz has ended pop up and a timer

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperClass } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { GetQuizByIdDocument } from "~/generated/generated";
import { Navigation } from "swiper/modules";
import {
  type Question,
  type Options,
} from "~/pages/event/[slug]/quiz/[quizId]";
import { useQuery } from "@apollo/client";
import { EventByOrganizerDocument } from "~/generated/generated";
import Image from "next/image";
// import Prism from "prismjs";
// import "prismjs/themes/prism-okaidia.css";
// import "prismjs/components/prism-python";
// import "prismjs/components/prism-java";
// import "prismjs/components/prism-javascript";
// import "prismjs/components/prism-c";
// import "prismjs/components/prism-cpp";
// import "prismjs/components/prism-markup";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

import {
  ChevronLeft,
  ChevronRight,
  HourglassIcon,
  Sliders,
  X,
} from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";

import { useRouter } from "next/router";
import { useAuth } from "~/hooks/useAuth";
import { HelperTooltip } from "~/components/general/dashboard/organizer/quiz/HelperToolTip";
import { IconStopwatch } from "@tabler/icons-react";

const QuizPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = router.query;

  const [eventId, roundId] = slug?.toString().split("-") ?? [];
  const roundInt = parseInt(roundId ?? "0");
  const [processedQuizScores, setProcessedQuizScores] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [quizName, setQuizName] = useState("");

  const { data } = useQuery(EventByOrganizerDocument, {
    variables: {
      organizerId: user?.id ?? "0",
    },
  });

  const event = data?.eventByOrganizer.find((event) => event.id === eventId);
  const round = event?.rounds.find((round) => round.roundNo === roundInt);
  const quizId = round?.quiz?.id;

  const { data: quizScores } = useQuery(GetQuizByIdDocument, {
    variables: { id: quizId ?? "" },
    skip: !quizId,
  });

  useEffect(() => {
    if (
      quizScores?.getQuizById.__typename === "QueryGetQuizByIdSuccess" &&
      !processedQuizScores
    ) {
      const qs = quizScores.getQuizById.data;
      const mappedqs = qs.questions.map((question) => ({
        id: question.id,
        question: question.question,
        image: question.image,
        options: question.options,
        isCode: question.isCode,
        description: question.description,
      }));

      setQuizName(qs.name);

      setQuestions(mappedqs);
      setProcessedQuizScores(true);
    }
  }, [quizScores, processedQuizScores]);

  const [selectedAnswers, setSelectedAnswers] = useState<Options[]>([]);
  // const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(
  //   null
  // );

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  // const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  useEffect(() => {
    const savedData = sessionStorage.getItem(
      `selectionOptions-${user?.id}-${quizId}`,
    );
    if (savedData) {
      const savedAnswers: Options[] = JSON.parse(savedData) as Options[];
      setSelectedAnswers(savedAnswers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hljs.highlightAll();
  }, [isReviewOpen]);

  useEffect(() => {
    hljs.highlightAll();
  }, [questions]);

  const [quizTrackerVisible, setQuizTrackerVisible] = useState(true);
  const [trackerPage, setTrackerPage] = useState(0);

  const questionsPerPage = 6;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  // Calculate which questions to show in the tracker
  const startIndex = trackerPage * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, questions.length);
  const visibleQuestions = questions.slice(startIndex, endIndex);

  // Auto-adjust tracker page when current question is out of view
  useEffect(() => {
    const newPage = Math.floor(currentSlide / questionsPerPage);
    if (newPage !== trackerPage) {
      setTrackerPage(newPage);
    }
  }, [currentSlide]);

  const handleNextTrackerPage = () => {
    if (trackerPage < totalPages - 1) {
      setTrackerPage((prev) => prev + 1);
    }
  };

  const handlePrevTrackerPage = () => {
    if (trackerPage > 0) {
      setTrackerPage((prev) => prev - 1);
    }
  };
  // const handleFinalSubmit = useCallback(() => {
  //   console.log(selectedAnswers);
  //   sessionStorage.removeItem("savedQuizData");
  //   onComplete();
  // }, [onComplete]);

  // useEffect(() => {
  //   if (quizFetchData?.getQuizById.__typename === "QueryGetQuizByIdSuccess") {
  //     const quizData = quizFetchData.getQuizById.data;
  //     if (quizData) {
  //       console.log(quizData);
  //       setQuizData(quizData);
  //       if (quizData.startTime && quizData.endTime) {
  //         setTimer((new Date(quizData.endTime).getTime() - Date.now()) / 1000);
  //       }
  //     }
  //   }
  // }, [quizFetchData]);
  // const handleSlideChange = (swiper: SwiperClass) => {
  //   setCurrentSlide(swiper.activeIndex);
  // };
  const handleOptionSelect = (option: Options) => {
    setSelectedAnswers((prev) => {
      const updatedAnswers = prev.filter(
        (answer) => answer.questionId !== option.questionId,
      );
      updatedAnswers.push(option);
      sessionStorage.setItem(
        `selectionOptions-${user?.id}-${quizId}`,
        JSON.stringify(updatedAnswers),
      );
      console.log(updatedAnswers);
      return updatedAnswers;
    });
  };

  useEffect(() => {
    console.log("Selected Answers", selectedAnswers);
  }, [selectedAnswers]);
  const progressPercentage = ((currentSlide + 1) / questions.length) * 100;

  const handlePrevSlide = () => {
    if (swiper) {
      swiper.slidePrev();
    }
  };

  const handleNextSlide = () => {
    if (swiper) {
      swiper.slideNext();
    }
  };

  return (
    <div className="relative flex flex-col justify-between items-center bg-gradient-to-br from-blue-950 via-purple-900 to-fuchsia-900 text-white">
      {/* Header */}

      <header className="w-3/4 mx-auto mt-16 backdrop-blur-lg bg-black/30 border-b-[1.5px] border-b-white border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            {quizName}
          </h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <IconStopwatch className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-200">00:00</span>
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mt-6 px-4">
        <div className="w-60 md:w-96 h-[0.7rem] bg-blue-950/50 rounded-full overflow-hidden">
          <div
            className="relative h-full progress-bar-effect"
            style={{ width: `${progressPercentage}%` }}
          >
            <HourglassIcon className="absolute -right-[2px] w-[0.75rem] h-3" />
          </div>
        </div>
        <p className=" text-center text-[1rem] text-cyan-200 mt-2">
          Question {currentSlide + 1} of {questions.length}
        </p>
      </div>

      {/* Main Content with Swiper */}
      <main className="w-[90%] md:w-3/4 mx-auto mt-8 px-2">
        <Swiper
          onSwiper={setSwiper}
          modules={[Navigation]}
          onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
          spaceBetween={24}
          slidesPerView={1}
          allowTouchMove={false}
        >
          {questions.map((question, index) => (
            <SwiperSlide key={index} className="">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-cyan-500/20">
                <div className=" flex flex-col gap-4 lg:flex-row">
                  <div className="lg:w-1/2 flex flex-col justify-evenly gap-6 border-[1.5px] border-gray-100 p-3 rounded-3xl">
                    <div className="flex gap-2 -space-y-[0.5px]">
                      <span className="font-bold text-[1rem] sm:text-lg bg-gradient-to-tr from-cyan-300 via-fuchsia-300 to-pink-400 text-transparent bg-clip-text">
                        {" "}
                        Q{index + 1 + ". "}
                      </span>
                      <p className="text-pretty text-[1rem] sm:text-lg font-medium">
                        {question.question}
                      </p>
                    </div>
                    {question.image && (
                      <Image
                        width={300}
                        height={300}
                        src={question.image}
                        alt="question_image"
                        className="mx-auto w-3/4 rounded-xl border border-cyan-500/20"
                      />
                    )}

                    {question.description && question.isCode && (
                      <div className="bg-blue-950/50 rounded-xl p-4 border border-cyan-500/20 shadow-lg">
                        <h3 className="text-cyan-300 mb-2 font-semibold">
                          Code:
                        </h3>
                        <pre className="p-0 m-0 bg-transparent overflow-x-auto rounded-md">
                          <code className="bg-transparent">
                            {question.description}
                          </code>
                        </pre>
                      </div>
                    )}

                    {question.description && !question.isCode && (
                      <div className="bg-blue-950/50 rounded-xl p-4 border border-cyan-500/20">
                        <h3 className="text-cyan-300 mb-2">Description:</h3>
                        <p className="text-pink-200">{question.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-full sm:grid sm:grid-cols-2 lg:flex flex-col mx-auto lg:w-1/2 items-center justify-center gap-y-4 gap-x-6 border-[1.5px] border-gray-100 p-3 rounded-3xl">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option)}
                        className={`my-4 sm:m-0 flex gap-2 w-full min-h-24 p-3 text-pretty rounded-xl text-left transition-all border ${
                          selectedAnswers.find((a) => a.id === option.id)
                            ? "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 border-transparent"
                            : "bg-blue-950/30 border-cyan-500/20 hover:bg-blue-900/40"
                        }`}
                      >
                        <span className="font-bold text-cyan-400">
                          {String.fromCharCode(65 + optionIndex)}.{" "}
                        </span>
                        <span>{option.value}</span>
                      </button>
                    ))}
                  </div>
                  <div className="hidden md:flex lg:flex-col items-center gap-2 justify-center">
                    <button
                      onClick={handlePrevTrackerPage}
                      disabled={trackerPage === 0}
                      className={`p-1 rounded-full transition-all ${
                        trackerPage === 0
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-cyan-400 hover:bg-white/10"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5 lg:rotate-90" />
                    </button>

                    <div className="bg-blue-950 rounded-3xl border-t border-cyan-500/20 px-2 flex lg:flex-col lg:h-[20rem] justify-center gap-2 overflow-x-hidden">
                      {visibleQuestions.map((_, index) => {
                        const questionNumber = startIndex + index;
                        return (
                          <button
                            key={questionNumber}
                            onClick={() => swiper?.slideTo(questionNumber)}
                            className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full font-medium transition-all ${
                              currentSlide === questionNumber
                                ? "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500"
                                : selectedAnswers.find(
                                      (a) =>
                                        a.questionId ===
                                        questions[questionNumber]?.id,
                                    )
                                  ? "bg-fuchsia-600"
                                  : "bg-blue-950/50"
                            }`}
                          >
                            {questionNumber + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleNextTrackerPage}
                      disabled={trackerPage >= totalPages - 1}
                      className={`p-1 rounded-full transition-all ${
                        trackerPage >= totalPages - 1
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-cyan-400 hover:bg-white/10"
                      }`}
                    >
                      <ChevronRight className="w-5 h-5 lg:rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <div className="flex justify-between m-4">
          <button
            onClick={handlePrevSlide}
            className={`w-26 md:w-32 px-4 py-2 rounded-md shadow-md transition-all glass-button ${
              currentSlide > 0
                ? "bg-transparent border border-white text-white"
                : "opacity-0 cursor-auto"
            }`}
            disabled={currentSlide === 0}
          >
            Previous
          </button>

          <button
            onClick={handleNextSlide}
            className={`w-20 md:w-32 px-4 py-2 rounded-md shadow-md transition-all glass-button ${
              currentSlide < questions.length - 1
                ? "bg-transparent border border-white text-white"
                : "opacity-0 cursor-auto"
            }`}
            disabled={currentSlide === questions.length - 1}
          >
            Next
          </button>
        </div>
        <div className="hidden md:flex w-[90%] px-2 py-1 md:p-4 justify-center gap-4 md:flex-col">
          <div className="ctrl-btns flex justify-evenly gap-4">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="max-w-48 flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 font-medium hover:opacity-90 transition-all"
            >
              Review Quiz
            </button>
            <button
              onClick={() => setIsSubmitDialogOpen(true)}
              className="max-w-48 flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-medium hover:opacity-90 transition-all"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </main>
      {/* Question Navigator */}
      {/* Question Navigator Toggle */}
      <div className="block md:hidden absolute top-[7.25rem] right-1 z-50 cursor-pointer">
        {!quizTrackerVisible && <HelperTooltip />}
        <span onClick={() => setQuizTrackerVisible(!quizTrackerVisible)}>
          <Sliders
            className={`w-8 h-8 p-1 border-secondary-50 border-2 text-slate-50 rounded-3xl ${
              quizTrackerVisible ? "rotate-90" : "-rotate-90"
            }`}
          />
        </span>
      </div>
      <div
        className={`quiz-nav flex md:hidden h-[24%] sm:h-[32%] p-2 bg-blue-950 rounded-3xl border-t border-cyan-500/20 my-6 ${!quizTrackerVisible && "hidden"}`}
      >
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={handlePrevTrackerPage}
            disabled={trackerPage === 0}
            className={`p-1 rounded-full transition-all ${
              trackerPage === 0
                ? "text-gray-500 cursor-not-allowed"
                : "text-cyan-400 hover:bg-white/10"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="bg-blue-950 rounded-3xl border-t border-cyan-500/20 px-2 flex flex-col gap-2 overflow-x-hidden">
            {visibleQuestions.map((_, index) => {
              const questionNumber = startIndex + index;
              return (
                <button
                  key={questionNumber}
                  onClick={() => swiper?.slideTo(questionNumber)}
                  className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full font-medium transition-all ${
                    currentSlide === questionNumber
                      ? "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500"
                      : selectedAnswers.find(
                            (a) =>
                              a.questionId === questions[questionNumber]?.id,
                          )
                        ? "bg-fuchsia-600"
                        : "bg-blue-950/50"
                  }`}
                >
                  {questionNumber + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNextTrackerPage}
            disabled={trackerPage >= totalPages - 1}
            className={`p-1 rounded-full transition-all ${
              trackerPage >= totalPages - 1
                ? "text-gray-500 cursor-not-allowed"
                : "text-cyan-400 hover:bg-white/10"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full px-2 py-1 md:p-4 gap-4 md:flex-col">
          <div className="flex flex-col ctrl-btns items-center justify-center gap-4 p-4">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 font-medium hover:opacity-90 transition-all"
            >
              Review Quiz
            </button>
            <button
              onClick={() => setIsSubmitDialogOpen(true)}
              className="w-full flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-medium hover:opacity-90 transition-all"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-blue-900 to-purple-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-cyan-500/20">
            <div className="sticky top-0 backdrop-blur-md bg-gradient-to-tr bg-blue-950 p-4 border-b border-secondary-50 flex justify-between items-center shadow-md">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-secondary-400 to-secondary-300 bg-clip-text text-transparent">
                Review Your Answers
              </h2>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full border-2 border-white text-secondary-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-blue-950/50 rounded-xl p-4 border border-cyan-500/20"
                >
                  <h3 className="font-medium mb-4 text-cyan-200">
                    Q{index + 1}. {question.question}
                  </h3>

                  {question.image && (
                    <Image
                      width={300}
                      height={300}
                      src={question.image}
                      alt="Question"
                      className="mx-auto w-3/4 rounded-xl mb-4 border border-cyan-500/20"
                    />
                  )}

                  {question.description && question.isCode && (
                    <div className="bg-blue-950/50 rounded-xl p-4 mb-4 border border-cyan-500/20">
                      <h4 className="text-cyan-300 mb-2">Code:</h4>
                      <pre className="text-pink-200 overflow-x-auto">
                        <code>{question.description}</code>
                      </pre>
                    </div>
                  )}

                  {question.description && !question.isCode && (
                    <div className="bg-blue-950/50 rounded-xl p-4 mb-4 border border-cyan-500/20">
                      <h4 className="text-cyan-300 mb-2">Description:</h4>
                      <p className="text-pink-200">{question.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg ${
                          selectedAnswers.find((a) => a.id === option.id)
                            ? "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500"
                            : "bg-blue-950/30 border border-cyan-500/20"
                        }`}
                      >
                        {" "}
                        <span className="font-bold text-cyan-400">
                          {String.fromCharCode(65 + optionIndex)}.{" "}
                        </span>
                        {option.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isSubmitDialogOpen && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-blue-900 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-cyan-500/20">
            <h2 className="text-lg font-bold text-white">Confirm Submission</h2>
            <p className="text-gray-300">
              Are you sure you want to submit your answers?
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsSubmitDialogOpen(false)}
                className="mr-2 py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                Cancel
              </button>
              <button className="py-2 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;

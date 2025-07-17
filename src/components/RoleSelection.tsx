import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { usePoll } from "../context/PollContext";

export const RoleSelection: React.FC = () => {
  const { state, dispatch } = usePoll();

  const roleOptions = [
    {
      id: "student",
      title: "I'm a Student",
      description: "Join a live poll session and submit your answers in real-time",
    },
    {
      id: "teacher",
      title: "I'm a Teacher",
      description: "Create questions and view live poll results from your students",
    },
  ];

  const handleContinue = () => {
    if (state.userRole) {
      dispatch({ type: 'CONFIRM_ROLE' });
    }
  };

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-[1440px] h-[923px] relative">
        <div className="flex flex-col w-[981px] items-center gap-[69px] absolute top-[289px] left-[243px]">
          <div className="inline-flex flex-col items-center gap-[26px] relative flex-[0_0_auto]">
            <div className="flex flex-col w-[737px] items-center gap-[5px] relative flex-[0_0_auto]">
              <h1 className="relative self-stretch mt-[-1.00px] font-['Sora',Helvetica] text-[40px] text-center tracking-[0] leading-normal">
                <span className="font-normal text-black">Welcome to the </span>
                <span className="font-semibold text-black">
                  Live Polling System
                </span>
              </h1>

              <p className="relative self-stretch font-['Sora',Helvetica] font-normal text-[#00000080] text-[19px] text-center tracking-[0] leading-normal">
                Please select the role that best describes you to begin using
                the live polling system
              </p>
            </div>
          </div>
        </div>

        <Button 
          className="absolute w-[234px] h-[58px] top-[635px] left-[633px] rounded-[34px] bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-lg disabled:opacity-50"
          onClick={handleContinue}
          disabled={!state.userRole}
        >
          Continue
        </Button>

        <Badge className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 absolute top-[232px] left-[656px] rounded-3xl bg-[linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-sm">
          <img
            className="w-[14.66px] h-[14.65px]"
            alt="Vector"
            src="/vector.svg"
          />
          Intervue Poll
        </Badge>

        <div className="flex gap-8 absolute top-[442px] left-[346px]">
          {roleOptions.map((role) => (
            <Card
              key={role.id}
              className={`w-[387px] h-[143px] rounded-[10px] cursor-pointer transition-all duration-200 ${
                state.userRole === role.id
                  ? "border-2 border-blue-500 shadow-lg bg-blue-50"
                  : "border border-solid border-[#d9d9d9] hover:shadow-md"
              }`}
              onClick={() => dispatch({ type: 'SET_ROLE', payload: role.id as 'student' | 'teacher' })}
            >
              <CardContent className="flex flex-col items-start justify-center gap-[17px] p-[15px] pl-[25px] pr-[17px]">
                <div className="inline-flex flex-col items-start justify-center gap-[9px]">
                  <div className="inline-flex items-end justify-center gap-[11px]">
                    <h2 className="mt-[-1.00px] font-['Sora',Helvetica] font-semibold text-black text-[23px] tracking-[0] leading-normal whitespace-nowrap">
                      {role.title}
                    </h2>
                  </div>
                </div>
                <p className="font-['Sora',Helvetica] font-normal text-[#454545] text-base tracking-[0] leading-normal w-full h-11">
                  {role.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
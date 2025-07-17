import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { WifiOff } from 'lucide-react';
import { usePoll } from '../context/PollContext';

export const StudentNameInput: React.FC = () => {
  const { state, dispatch, joinSession } = usePoll();
  const [name, setName] = useState(state.studentName);

  // Show connection error if not connected
  if (!state.isConnected) {
    return (
      <div className="bg-white flex flex-row justify-center w-full">
        <div className="bg-white w-[1440px] h-[923px] relative flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <WifiOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-semibold mb-2">Connection Required</h2>
              <p className="text-gray-600 mb-4">
                Please check your internet connection to join the session.
              </p>
              {state.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {state.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('studentName', name.trim());
      dispatch({ type: 'SET_STUDENT_NAME', payload: name.trim() });
      // The actual joining will be handled by useEffect in StudentDashboard
    }
  };

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-[1440px] h-[923px] relative">
        <Badge className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 absolute top-[232px] left-[656px] rounded-3xl bg-[linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-sm">
          <img
            className="w-[14.66px] h-[14.65px]"
            alt="Vector"
            src="/vector.svg"
          />
          Intervue Poll
        </Badge>

        <div className="flex flex-col w-[600px] items-center gap-[40px] absolute top-[350px] left-[420px]">
          <div className="flex flex-col items-center gap-[20px]">
            <h1 className="font-['Sora',Helvetica] text-[36px] font-semibold text-black text-center">
              Enter Your Name
            </h1>
            <p className="font-['Sora',Helvetica] font-normal text-[#00000080] text-[18px] text-center">
              Please enter a unique name to join the polling session
            </p>
          </div>

          <Card className="w-full max-w-[500px]">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Sora',Helvetica] text-lg"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-[50px] rounded-[25px] bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-lg"
                  disabled={!name.trim()}
                >
                  Join Session
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
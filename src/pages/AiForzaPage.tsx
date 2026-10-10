import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AiForzaCallExperience } from '../components/forza/AiForzaCallExperience';

export const AiForzaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen min-h-[100svh] max-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#CBD2D8] via-[#DEE2E5] to-[#F4F4F5] p-0 m-0">
      <AiForzaCallExperience onClose={() => navigate('/')} />
    </div>
  );
};

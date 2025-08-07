'use client'

import React from 'react'
import { Position } from '@/types/canvas'

interface DropIndicatorProps {
  position: Position | null
  isVisible: boolean
}

export function DropIndicator({ position, isVisible }: DropIndicatorProps) {
  if (!isVisible || !position) return null

  return (
    <div 
      className="drop-indicator"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="drop-indicator-content">
        <i className="fas fa-plus"></i>
        <span>放置在这里</span>
      </div>

      <style jsx>{`
        .drop-indicator {
          position: absolute;
          z-index: 1000;
          pointer-events: none;
          transform: translate(-50%, -50%);
          animation: dropIndicatorPulse 1.5s ease-in-out infinite;
        }

        .drop-indicator-content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .drop-indicator-content i {
          font-size: 16px;
        }

        @keyframes dropIndicatorPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 0.8;
          }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .drop-indicator-content {
            background: rgba(59, 130, 246, 0.95);
            border-color: rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </div>
  )
}
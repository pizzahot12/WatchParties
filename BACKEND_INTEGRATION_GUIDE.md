# Backend Integration Guide

This document outlines the API endpoints and data structures required to power the StreamParty frontend.

## Overview

The frontend is built with React, TypeScript, and Tailwind CSS. It uses a set of TypeScript interfaces to define the data models. The backend should provide data matching these interfaces.

## Authentication

All API requests should be authenticated. The frontend expects a JWT token or session cookie.

## API Endpoints

### Media

-   **GET /api/media/featured**
    -   **Description**: Returns the featured media item for the Hero section.
    -   **Response**: `MediaInterface` object.
-   **GET /api/media/trending**
    -   **Description**: Returns a list of trending movies and TV shows.
    -   **Response**: Array of `MediaInterface` objects.
-   **GET /api/media/:id**
    -   **Description**: Returns detailed information for a specific media item.
    -   **Response**: `MediaInterface` object.
-   **GET /api/media/:id/seasons**
    -   **Description**: Returns seasons and episodes for a TV show.
    -   **Response**: Array of `SeasonInterface` objects.

### Users & Social

-   **GET /api/users/me**
    -   **Description**: Returns the current user's profile.
    -   **Response**: `UserInterface` object.
-   **GET /api/users/friends**
    -   **Description**: Returns the current user's friends list with real-time status.
    -   **Response**: Array of `UserInterface` objects.
-   **POST /api/users/friends/invite**
    -   **Description**: Invites a user to become a friend.
    -   **Body**: `{ userId: string }`

### Servers (Plex/Jellyfin)

-   **GET /api/servers**
    -   **Description**: Returns a list of connected media servers.
    -   **Response**: Array of `ServerInterface` objects.
-   **POST /api/servers/connect**
    -   **Description**: Connects a new media server.
    -   **Body**: `{ type: 'plex' | 'jellyfin', url: string, token: string }`

### Watch Party (WebSocket)

The Watch Party feature relies on real-time communication.

**Events:**

-   `room:join`: Client joins a room.
-   `room:leave`: Client leaves a room.
-   `player:state`: Syncs play/pause/seek state.
    -   Payload: `{ status: 'playing' | 'paused', currentTime: number }`
-   `chat:message`: Sends/receives chat messages.
    -   Payload: `ChatMessageInterface`

## Data Models

Refer to `src/types/index.ts` for the exact TypeScript definitions of:

-   `UserInterface`
-   `MediaInterface`
-   `ServerInterface`
-   `ChatMessageInterface`

## Mock Data

The frontend currently uses mock data located in `src/data/mockData.ts`. To integrate with the backend:

1.  Replace the imports from `../data/mockData` with API calls (e.g., using `fetch` or `axios`).
2.  Ensure the API responses match the structure of the mock data.

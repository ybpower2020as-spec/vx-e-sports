# VX E-Sports Discord Bot

## Overview

VX E-Sports Discord Bot is a comprehensive Discord bot built with discord.js v14 designed for managing gaming communities and esports teams. The bot provides features for tournament registration, team management, moderation tools, and voice channel automation. It's specifically tailored for Arabic-speaking gaming communities with role-based permission systems and automated scrimming functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Framework
- **Discord.js v14**: Primary framework for Discord API interactions
- **Node.js**: Runtime environment
- **Express.js**: Web server framework for potential webhook endpoints
- **@discordjs/voice**: Voice channel management and automation

### Bot Architecture
- **Single-file monolithic design**: All functionality contained in index.js for simplicity
- **Event-driven architecture**: Responds to Discord events and user interactions
- **Command-based system**: Uses Discord slash commands for user interactions
- **Role-based permissions**: Granular access control using Discord roles

### Permission System
- **Multi-tier role hierarchy**: Different permission levels for various commands
- **Blacklist functionality**: Role-based user restrictions
- **Administrator override**: Admin users bypass most restrictions
- **Command-specific permissions**: Each command has its own allowed roles configuration

### Voice Channel Management
- **24/7 voice presence**: Bot maintains constant connection to designated voice channel
- **Automated voice operations**: Join/leave functionality for scrimming activities
- **Voice state monitoring**: Tracks user voice channel activities

### Data Management
- **In-memory storage**: No persistent database, uses JavaScript Collections
- **Environment-based configuration**: Sensitive data stored in environment variables
- **Guild-specific operations**: Designed for single-server deployment

### Moderation Features
- **User management**: Kick, ban, unban, mute, unmute capabilities
- **Message management**: Clear/purge functionality
- **Role-based enforcement**: Moderation actions respect role hierarchy

### Registration System
- **Tournament registration**: User signup and management system
- **Spare player management**: Reserve player functionality
- **Registration controls**: Open/close registration periods

## External Dependencies

### Discord Services
- **Discord API**: Primary platform integration via discord.js
- **Discord Voice API**: Voice channel operations via @discordjs/voice
- **Discord REST API**: Command registration and API calls

### Node.js Packages
- **discord.js v14**: Main Discord library
- **@discordjs/rest**: RESTful API interactions
- **@discordjs/voice**: Voice functionality
- **discord-api-types**: TypeScript definitions for Discord API
- **express**: Web server framework

### Environment Configuration
- **DISCORD_TOKEN**: Bot authentication token
- **DISCORD_CLIENT_ID**: Application client identifier
- **DISCORD_GUILD_ID**: Target server identifier
- **Voice channel IDs**: Hardcoded channel identifiers for automation
- **Role IDs**: Permission system role identifiers

### Infrastructure Requirements
- **Node.js runtime**: Version 16.11.0 or higher
- **Persistent hosting**: Required for 24/7 voice channel presence
- **Environment variable support**: For secure configuration management
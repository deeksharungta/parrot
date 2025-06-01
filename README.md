# XCast - Twitter to Farcaster Bridge

XCast is a Farcaster Mini App that allows users to easily cross-post their Twitter content to Farcaster. Users can connect their verified Twitter accounts, monitor their tweets, and selectively cast them to Farcaster with just a tap.

## Features

- 🔗 **Seamless Integration**: Connects verified Twitter accounts through Farcaster
- 📱 **Mobile-First Design**: Optimized for mobile viewing in Farcaster clients
- 🔄 **Real-time Monitoring**: Automatically fetches recent tweets
- ✅ **Selective Casting**: Choose which tweets to cast to Farcaster
- 📊 **Status Tracking**: Track the status of each cast (pending, approved, cast, failed)
- 💜 **Native Experience**: Built with Farcaster Frame SDK for seamless integration

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Neynar API Configuration
NEYNAR_API_KEY=your_neynar_api_key_here

# Optional: Twitter API (for production usage)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
```

### 2. Database Setup

The app uses Supabase as the database. Make sure your Supabase project has the following tables:

#### Users Table

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  twitter_id TEXT,
  twitter_username TEXT,
  twitter_display_name TEXT,
  twitter_access_token TEXT,
  twitter_refresh_token TEXT,
  twitter_connected_at TIMESTAMP WITH TIME ZONE,
  farcaster_fid INTEGER,
  farcaster_username TEXT,
  farcaster_display_name TEXT,
  neynar_signer_uuid TEXT,
  farcaster_connected_at TIMESTAMP WITH TIME ZONE,
  yolo_mode BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_approve BOOLEAN DEFAULT FALSE,
  usdc_balance NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  spending_approved BOOLEAN DEFAULT FALSE,
  spending_limit NUMERIC DEFAULT 0
);
```

#### Tweets Table

```sql
CREATE TABLE tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  twitter_id TEXT,
  content TEXT NOT NULL,
  original_content TEXT,
  twitter_url TEXT,
  twitter_created_at TIMESTAMP WITH TIME ZONE,
  cast_status TEXT DEFAULT 'pending' CHECK (cast_status IN ('pending', 'approved', 'rejected', 'cast', 'failed')),
  cast_hash TEXT,
  cast_url TEXT,
  cast_created_at TIMESTAMP WITH TIME ZONE,
  cast_price NUMERIC DEFAULT 0,
  payment_approved BOOLEAN DEFAULT FALSE,
  payment_processed BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edit_count INTEGER DEFAULT 0,
  auto_cast BOOLEAN DEFAULT FALSE
);
```

### 3. Installation

```bash
npm install
# or
yarn install
```

### 4. Development

```bash
npm run dev
# or
yarn dev
```

### 5. Prerequisites

- **Farcaster Account**: Users need a Farcaster account to use the app
- **Verified Twitter**: Users must have their Twitter account verified on Farcaster
- **Neynar API Key**: Required for Farcaster interactions
- **Supabase Project**: For data storage

## How It Works

1. **User Authentication**: Users connect through their Farcaster account
2. **Twitter Verification**: App checks for verified Twitter account on Farcaster
3. **Tweet Monitoring**: Fetches recent tweets from the user's Twitter account
4. **Content Review**: Users can review and approve/reject tweets
5. **Farcaster Casting**: Approved tweets are automatically cast to Farcaster

## User Flow

```
Farcaster User → Verify Twitter → Save to DB → Monitor Tweets → Show Loader → Display Tweets → Cast to Farcaster
```

## API Endpoints

- `POST /api/user` - Save/update user data and get verified Twitter account
- `GET /api/user?fid={fid}` - Retrieve user data
- `POST /api/twitter/monitor` - Start Twitter monitoring and fetch tweets
- `GET /api/twitter/monitor?userId={id}` - Get user's tweets
- `POST /api/tweets/action` - Approve/reject tweets for casting

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Farcaster**: Neynar API, Farcaster Frame SDK
- **UI**: Mobile-first responsive design

## Deployment

The app is designed to work as a Farcaster Mini App. Deploy to Vercel or similar platforms:

1. Set up environment variables in your deployment platform
2. Connect your Supabase database
3. Deploy using your preferred method

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

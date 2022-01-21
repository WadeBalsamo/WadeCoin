# WadeCoin
This is my prototype for StoryTree.


STORYtree - Technical Summary of Dapplication Functions
An NFT Marketplace for Content Creators, Publishers, Investors, and Subscribers.
Providing shared ownership of a peer-reviewed tree of content, fairly governed collaborative conversations, collectively owned with shared monetization, to empower an immutable archive of socially valued dialogues


Phase 1: Distributed Video Monetization 
Launch on Matic Network
ERC-1155 Marketplace for NFT Premium Content Membership 
Platform currency: StoryCoin (ERC-20, 100M fixed supply)

Base Functions for shared monetization protocol:

Upload: (require gas + 100 StoryCoin)
	Inputs: SampleVideo.mp4, PremiumVideo.mp4, title, description, buyPrice, viewPrice%
Mint: 1 Sample NFT to IPFS, for Marketplace to show
Mint: 100 Premium Content NFTs to IPFS
		Send 99 Premium Content NFT Tokens to the artist when minted
Marketplace holds and rents the last Token, it is unsellable/unburnable
	buyPrice is the starting price set per NFT of this content, valued in StoryCoin (default 1)
	viewPrice% sets thread viewPrice as % of buy price, default 0.01% (10,000 views=ROI)
		
Rent/View:
	NFTs freely access all premium content minted by the artist and the comment thread
	Any user can ‘rent access’ to any content on the marketplace, paying rentalFee
	rentalFee payments are split between all token holding addresses
	rentalFee = viewPrice * (numberOfTokens - 1) / 100. 
If only 1 token, rentalFee = 0, all users can view free

Buy/Sell:
	Users can sell their tokens to the marketplace at going rate
	Token sale costs a 5% royalty to Marketplace on any buy/sell order

Phase 2: Token Governance for Peer Reviewed Comment and Dialogue Threads
Functions for governance on comment moderation:
	Users can burn 10 NFT tokens from a video to submit a new upload ‘comment’ to thread
	Burning Tokens reduces Paywall on the original content
		Tokens of parents’ branch have *7 days* to vote or veto any submitted upload
			Each % veto reduces new tokens on submitted comment by 2, from 100
E.g. 1%veto = 98 new tokens minted on comment, 50% veto refuses mint

Tokens of commented content are an AccessPass for only its own branch of n-ary tree 
AccessPasses provide access to all historical parents and all future children of a thread.
NFT tokens at the base provide full access to the artist’s channel and the thread of that NFT.

Phase 3: Scalability and Optimization
As gas, scale, and traffic increases, Port to Harmony One for faster finality and lower fees
		
STORY User Interface Prototype idea:

HOMEPAGE:
Top left - Story logo -  “Publish Story” button (Link to a publish interface like youtube upload)

Menu (left) filters content:
All / filter by artist  / Platform Guide 

Main available content on right, title / tagline

Upload Modal / interface allows you to select a file, add details:
	Inputs: SampleVideo.mp4, PremiumVideo.mp4, title, description, startingBuyPrice, viewPrice%ofBuyPrice

Clicking content thumbnail opens content page, showing the video, thumbnail/trailer, description Buy/Sell (price), Rent (price) Stats: (tokenCount, viewCount, totalValue, ownerCount, seeOwners)

Interface for the threads, Phase II:
Home Top Right “Vote / peer review”  (view to vote) appears for token holding addresses
Only appears if a branch was submitted to their thread within the last 7 days

Down arrow on any sample video opens up a content thread / tree of comments in a flowchart, each bubble as an image/description with an expand button (if applicable). Marked by *color outline* if the viewer owns any share in that note.


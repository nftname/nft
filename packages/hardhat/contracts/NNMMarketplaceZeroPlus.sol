/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NNMMarketplaceZeroPlus
 * @notice Zero-Liability, Non-Custodial Marketplace
 * - Atomic swaps only
 * - No escrow
 * - NFT stays with owner until sale
 * - Funds stay with buyer until acceptance
 */
contract NNMMarketplaceZeroPlus is ReentrancyGuard, Ownable {

    IERC721 public immutable nftContract;
    IERC20  public immutable wpolContract;

    uint256 public platformFee = 100; // 1%
    uint256 public constant MAX_FEE = 500; // Max 5%

    struct Listing {
        address seller;
        uint256 price;
        bool exists;
    }

    struct Offer {
        address bidder;
        uint256 price;
        uint256 expiration;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(address => Offer)) public offers;
    mapping(uint256 => bool) public hasSoldBefore;

    event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, uint256 indexed tokenId);
    
    event ItemSold(
        address indexed buyer,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price,
        bool firstSale
    );

    event OfferMade(address indexed bidder, uint256 indexed tokenId, uint256 price);
    event OfferCanceled(address indexed bidder, uint256 indexed tokenId);
    event OfferAccepted(
        address indexed seller,
        address indexed bidder,
        uint256 indexed tokenId,
        uint256 price
    );

    event PlatformFeeUpdated(uint256 newFee);

    constructor(address _nftAddress, address _wpolAddress) Ownable(msg.sender) {
        nftContract = IERC721(_nftAddress);
        wpolContract = IERC20(_wpolAddress);
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee exceeds max");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    // --- Fixed Price (Native POL) ---
    function listItem(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Invalid price");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)) || nftContract.getApproved(tokenId) == address(this), "Not approved");

        listings[tokenId] = Listing(msg.sender, price, true);
        emit ItemListed(msg.sender, tokenId, price);
    }

    function cancelListing(uint256 tokenId) external nonReentrant {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        delete listings[tokenId];
        emit ItemCanceled(msg.sender, tokenId);
    }

    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing memory item = listings[tokenId];
        require(item.exists, "Not listed");
        require(msg.value >= item.price, "Insufficient payment");
        require(nftContract.ownerOf(tokenId) == item.seller, "Owner changed");

        delete listings[tokenId];

        uint256 fee = (item.price * platformFee) / 10000;
        uint256 sellerAmount = item.price - fee;
        bool firstSale = !hasSoldBefore[tokenId];
        hasSoldBefore[tokenId] = true;

        nftContract.safeTransferFrom(item.seller, msg.sender, tokenId);
        payable(owner()).transfer(fee);
        payable(item.seller).transfer(sellerAmount);

        if (msg.value > item.price) {
            payable(msg.sender).transfer(msg.value - item.price);
        }

        emit ItemSold(msg.sender, item.seller, tokenId, item.price, firstSale);
    }

    // --- Offers (WPOL) ---
    function makeOffer(uint256 tokenId, uint256 price, uint256 duration) external nonReentrant {
        require(price > 0, "Invalid price");
        require(wpolContract.allowance(msg.sender, address(this)) >= price, "Insufficient allowance");
        require(wpolContract.balanceOf(msg.sender) >= price, "Insufficient balance");

        offers[tokenId][msg.sender] = Offer(msg.sender, price, block.timestamp + duration);
        emit OfferMade(msg.sender, tokenId, price);
    }

    function cancelOffer(uint256 tokenId) external nonReentrant {
        delete offers[tokenId][msg.sender];
        emit OfferCanceled(msg.sender, tokenId);
    }

    function acceptOffer(uint256 tokenId, address bidder) external nonReentrant {
        Offer memory offer = offers[tokenId][bidder];
        require(offer.price > 0, "No offer");
        require(offer.expiration > block.timestamp, "Expired");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)) || nftContract.getApproved(tokenId) == address(this), "Not approved");

        delete offers[tokenId][bidder];
        delete listings[tokenId];

        uint256 fee = (offer.price * platformFee) / 10000;
        uint256 sellerAmount = offer.price - fee;
        bool firstSale = !hasSoldBefore[tokenId];
        hasSoldBefore[tokenId] = true;

        nftContract.safeTransferFrom(msg.sender, bidder, tokenId);
        wpolContract.transferFrom(bidder, owner(), fee);
        wpolContract.transferFrom(bidder, msg.sender, sellerAmount);

        emit OfferAccepted(msg.sender, bidder, tokenId, offer.price);
        emit ItemSold(bidder, msg.sender, tokenId, offer.price, firstSale);
    }

    // --- Views ---
    function isListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].exists;
    }
    
    function listingPrice(uint256 tokenId) external view returns (uint256) {
        return listings[tokenId].price;
    }
}

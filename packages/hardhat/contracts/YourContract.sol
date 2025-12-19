// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// التغيير هنا: تم النقل من security إلى utils
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// التغيير هنا: تم النقل من security إلى utils
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NNMRegistryV9 is
    ERC721URIStorage,
    ERC721Enumerable,
    Pausable,
    Ownable,
    ReentrancyGuard,
    ERC2981
{
    using Strings for uint256;

    enum Tier {
        IMMORTAL,
        ELITE,
        FOUNDER
    }

    AggregatorV3Interface public priceFeed;

    uint256 public priceImmortal = 50 * 1e18;
    uint256 public priceElite = 30 * 1e18;
    uint256 public priceFounder = 10 * 1e18;

    uint256 private _tokenIds;

    struct NameData {
        string name;
        Tier tier;
        uint256 mintTime;
    }

    mapping(uint256 => NameData) public nameRecords;
    mapping(bytes32 => bool) public registeredNames;

    string public constant LEGAL_DISCLAIMER =
        "This digital name is recorded on-chain with a verifiable creation timestamp and immutable registration data. It represents a Gen-0 registered digital asset within the NNM protocol and exists as a transferable NFT without renewal, guarantees, or dependency.";

    event NameMinted(
        uint256 indexed tokenId,
        string name,
        Tier tier,
        address indexed owner,
        uint256 timestamp
    );

    /* ================= AUTHORIZED MINTERS SYSTEM ================= */

    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public authorizedMintCount;
    uint256 public constant AUTHORIZED_MINT_LIMIT = 200;

    /* ================= CONSTRUCTOR ================= */

    constructor()
        ERC721("NNM Sovereign Asset", "NNM")
        Ownable(msg.sender)
    {
        priceFeed = AggregatorV3Interface(
            0xAB594600376Ec9fD91F8e885dADF0CE036862dE0
        );
        _setDefaultRoyalty(msg.sender, 500); // 5% Royalties
    }

    /* ================= ADMIN (OWNER) ================= */

    // [ADDED] Critical Withdraw Function for Owner
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    function reserveName(
        string memory _name,
        Tier _tier,
        string memory _tokenURI
    ) external onlyOwner {
        string memory cleanName = _validateAndFormatName(_name);
        _mintLogic(cleanName, _tier, msg.sender, _tokenURI);
    }

    function setAuthorizedMinter(address _wallet, bool _status)
        external
        onlyOwner
    {
        authorizedMinters[_wallet] = _status;
    }

    function setPrices(uint256 _immortal, uint256 _elite, uint256 _founder) external onlyOwner {
        priceImmortal = _immortal;
        priceElite = _elite;
        priceFounder = _founder;
    }

    /* ================= AUTHORIZED MINTERS ================= */

    // Gas only – limited per wallet
    function authorizedMint(
        string memory _name,
        Tier _tier,
        string memory _tokenURI
    ) external nonReentrant {
        require(authorizedMinters[msg.sender], "Not authorized");
        require(
            authorizedMintCount[msg.sender] < AUTHORIZED_MINT_LIMIT,
            "Mint limit reached"
        );

        string memory cleanName = _validateAndFormatName(_name);
        authorizedMintCount[msg.sender]++;

        _mintLogic(cleanName, _tier, msg.sender, _tokenURI);
    }

    /* ================= PUBLIC ================= */

    function mintPublic(
        string memory _name,
        Tier _tier,
        string memory _tokenURI
    ) external payable nonReentrant whenNotPaused {
        uint256 usdPrice;

        if (_tier == Tier.IMMORTAL) usdPrice = priceImmortal;
        else if (_tier == Tier.ELITE) usdPrice = priceElite;
        else if (_tier == Tier.FOUNDER) usdPrice = priceFounder;
        else revert("Invalid tier");

        uint256 cost = getMaticCost(usdPrice);
        require(msg.value >= cost, "Insufficient POL");

        string memory cleanName = _validateAndFormatName(_name);
        _mintLogic(cleanName, _tier, msg.sender, _tokenURI);

        if (msg.value > cost) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - cost
            }("");
            require(success, "Refund failed");
        }
    }

    /* ================= CORE ================= */

    function _mintLogic(
        string memory _name,
        Tier _tier,
        address _to,
        string memory _tokenURI
    ) internal {
        bytes32 nameHash = keccak256(abi.encodePacked(_name));
        require(!registeredNames[nameHash], "Name already taken");

        _tokenIds++;
        uint256 tokenId = _tokenIds;

        registeredNames[nameHash] = true;
        nameRecords[tokenId] = NameData(
            _name,
            _tier,
            block.timestamp
        );

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NameMinted(
            tokenId,
            _name,
            _tier,
            _to,
            block.timestamp
        );
    }

    function _validateAndFormatName(string memory _str)
        internal
        pure
        returns (string memory)
    {
        bytes memory b = bytes(_str);
        require(b.length >= 2 && b.length <= 40, "Invalid length");

        bytes memory newB = new bytes(b.length);

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];

            if (char >= 0x61 && char <= 0x7A)
                newB[i] = bytes1(uint8(char) - 32);
            else if (char >= 0x41 && char <= 0x5A)
                newB[i] = char;
            else if (char >= 0x30 && char <= 0x39)
                newB[i] = char;
            else revert("Invalid character");
        }

        return string(newB);
    }

    function getMaticCost(uint256 usdAmount)
        public
        view
        returns (uint256)
    {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Oracle error");
        // Chainlink returns 8 decimals. We want 18 decimals result.
        // Formula: (USD_18 * 1e18) / (Price_8 * 1e10)
        return (usdAmount * 1e18) / (uint256(price) * 1e10);
    }

    /* ================= OVERRIDES ================= */

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

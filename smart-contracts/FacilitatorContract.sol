// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IGhoToken.sol";

contract FacilitatorContract is AccessControl {

  bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_ROLE");

  IGhoToken public ghoToken;
  AggregatorV3Interface internal nftFloorPriceFeed;
  AggregatorV3Interface internal ETHdataFeed;
  uint256 constant LOAN_TO_VALUE_PERCENT = 80;

  struct NFT {
    address nftContract;
    uint256 tokenId;
  }

  mapping(address => NFT[]) public nftDeposits; // Mapping of depositor addresses to lists of NFTDeposit structs
  mapping(address => uint256) public borrowPower; // Mapping of depositor addresses to borrow power left
  mapping(address => address) public collections; // Mapping of Whitelisted Testnet NFT Collections to corresponding data feed contracts

  constructor(address _ghoToken, address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(NFT_MANAGER_ROLE, admin);
    ghoToken = IGhoToken(_ghoToken);

    // collections[0x4b07E711e5C9b5bF05e69f8B7fc46F67C81A730A]=0xB677bfBc9B09a3469695f40477d05bc9BcB15F50;

    ETHdataFeed = AggregatorV3Interface(
      0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
    );
  }

  function depositNFT(address nftContract, uint256 tokenId) external {
    require(collections[nftContract] != address(0), "NFT contract not whitelisted!");

    nftDeposits[msg.sender].push(NFT(nftContract, tokenId));
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    uint256 nftValueEth = uint256(getNFTPrice(nftContract));
    uint256 ethUsdPrice = uint256(getETHDataFeed());

    uint256 nftValueGho = (nftValueEth * ethUsdPrice) / 1e10;
    uint256 loanAmountGho = (nftValueGho * LOAN_TO_VALUE_PERCENT) / 100;

    borrowPower[msg.sender] += loanAmountGho;
  }

  function borrowGHO(uint256 amount)external {
    require(amount > 0, "Borrow amount must be greater than 0!");
    require(amount <= borrowPower[msg.sender], "Insufficient borrow power!");

    ghoToken.mint(msg.sender, amount);
    borrowPower[msg.sender] -= amount;
  }

  function repayGho( uint256 amount) external {
    require(amount > 0, "Repayment amount must be greater than 0!");
    require(borrowPower[msg.sender] >= amount, "Cannot repay more than borrowed!");

    ghoToken.burn(amount);
    borrowPower[msg.sender] += amount;
  }

  function withdrawNFT(address nftContract, uint256 tokenId) external {
    // Fetch the latest NFT value in GHO
    uint256 nftValueEth = uint256(getNFTPrice(nftContract));
    uint256 ethUsdPrice = uint256(getETHDataFeed());
    uint256 nftValueGho = (nftValueEth * ethUsdPrice) / 1e10;
    uint256 loanedAmountGho = (nftValueGho * LOAN_TO_VALUE_PERCENT) / 100;

    // Check if the NFT is in the user's deposit and if they have enough borrowPower after withdrawal
    bool isNFTDeposited = false;
    uint256 nftIndex;
    NFT[] storage userDeposits = nftDeposits[msg.sender];
    for (uint256 i = 0; i < userDeposits.length; i++) {
      if (userDeposits[i].nftContract == nftContract && userDeposits[i].tokenId == tokenId) {
        isNFTDeposited = true;
        nftIndex = i;
        break;
      }
    }

    require(isNFTDeposited, "NFT not deposited by user");
    require(borrowPower[msg.sender] >= loanedAmountGho, "Insufficient BorrowPower after withdrawal");

    // Update borrow power and remove NFT from deposit
    borrowPower[msg.sender] -= loanedAmountGho;
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    removeNFTFromDeposits(msg.sender, nftIndex);
  }

  function removeNFTFromDeposits(address user, uint256 index) internal {
    NFT[] storage userDeposits = nftDeposits[user];
    require(index < userDeposits.length, "Invalid index");

    // Move the last element to the deleted spot and pop the last element
    userDeposits[index] = userDeposits[userDeposits.length - 1];
    userDeposits.pop();
  }

  function whitelistCollection(address nftAddress, address priceFeedAddress) public {
    require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have NFT_MANAGER_ROLE");
    collections[nftAddress] = priceFeedAddress;
  }

  function getNFTPrice(address nftContract) public view returns (int) {
    require(collections[nftContract] != address(0), "NFT contract not whitelisted!");

    AggregatorV3Interface nftPriceFeed = AggregatorV3Interface(collections[nftContract]);
    (
      /* uint80 roundID */,
      int nftFloorPrice,
      /* uint startedAt */,
      /* uint timeStamp */,
      /* uint80 answeredInRound */
    ) = nftPriceFeed.latestRoundData();
    return nftFloorPrice;
  }

  function getETHDataFeed() public view returns (int) {
    (
      /* uint80 roundID */,
      int answer,
      /*uint startedAt*/,
      /*uint timeStamp*/,
      /*uint80 answeredInRound*/
    ) = ETHdataFeed.latestRoundData();
    return answer;
  }
}

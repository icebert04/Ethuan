//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Deed {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftAddress;

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    // variables
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public deedAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    // modifiers
    modifier onlySeller() {
        require(msg.sender == seller, "Seller Only Access");
        _;
    }
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Buyer Only Access");
        _;
    }
    modifier onlyInspector() {
        require(msg.sender == inspector, "Inspector Only Access");
        _;
    }

    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _deedAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        buyer[_nftID] = _buyer;
        deedAmount[_nftID] = _deedAmount;
    }

    // Can be Down payment or Earnest
    function earnestDeposit(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= deedAmount[_nftID]);
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed)
        public
        onlyInspector
    {
        inspectionPassed[_nftID] = _passed;
    }

    function approve(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    function closeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);

        isListed[_nftID] = false;
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    function cancelSale(uint256 _nftID) public {
        if (inspectionPassed[_nftID] == false) {
            // refund
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            // send to seller
            payable(seller).transfer(address(this).balance);
        }
    }
}

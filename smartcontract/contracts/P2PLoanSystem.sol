// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title P2PLoanSystem
 * @dev A peer-to-peer lending platform on Hedera network
 */
contract P2PLoanSystem {
    
    // Loan status enumeration
    enum LoanStatus {
        Requested,      // Loan has been requested by borrower
        Funded,         // Loan has been funded by lender
        Repaid,         // Loan has been fully repaid
        Defaulted       // Loan deadline passed without repayment
    }
    
    // Loan structure
    struct Loan {
        address borrower;
        address lender;
        uint256 loanAmount;
        uint256 interest;
        uint256 deadline;       // Unix timestamp
        LoanStatus status;
        uint256 createdAt;
    }
    
    // Storage
    mapping(uint256 => Loan) public loans;
    uint256 public loanCounter;
    
    // Events
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 loanAmount,
        uint256 interest,
        uint256 deadline
    );
    
    event LoanEdited(
        uint256 indexed loanId,
        uint256 newLoanAmount,
        uint256 newInterest,
        uint256 newDeadline
    );
    
    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 totalAmount
    );
    
    event LoanDefaulted(
        uint256 indexed loanId
    );
    
    // Custom errors
    error UnauthorizedAccess();
    error InvalidLoanAmount();
    error InvalidDeadline();
    error LoanNotFound();
    error LoanAlreadyFunded();
    error SelfFundingNotAllowed();
    error DeadlineExpired();
    error IncorrectRepaymentAmount();
    error IncorrectFundingAmount();
    error InvalidLoanStatus();
    
    // Modifiers
    modifier onlyBorrower(uint256 _loanId) {
        if (loans[_loanId].borrower != msg.sender) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    modifier loanExists(uint256 _loanId) {
        if (loans[_loanId].borrower == address(0)) {
            revert LoanNotFound();
        }
        _;
    }
    
    /**
     * @dev Request a new loan
     * @param _loanAmount Amount of loan requested in tinybars
     * @param _interest Interest amount in tinybars
     * @param _deadline Unix timestamp for loan deadline
     * @return loanId The ID of the created loan
     */
    function requestLoan(
        uint256 _loanAmount,
        uint256 _interest,
        uint256 _deadline
    ) external returns (uint256) {
        if (_loanAmount == 0) revert InvalidLoanAmount();
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        
        uint256 loanId = loanCounter++;
        
        loans[loanId] = Loan({
            borrower: msg.sender,
            lender: address(0),
            loanAmount: _loanAmount,
            interest: _interest,
            deadline: _deadline,
            status: LoanStatus.Requested,
            createdAt: block.timestamp
        });
        
        emit LoanRequested(loanId, msg.sender, _loanAmount, _interest, _deadline);
        
        return loanId;
    }
    
    /**
     * @dev Edit an existing loan request
     * @param _loanId The ID of the loan to edit
     * @param _newLoanAmount New loan amount
     * @param _newInterest New interest amount
     * @param _newDeadline New deadline
     */
    function editLoanRequest(
        uint256 _loanId,
        uint256 _newLoanAmount,
        uint256 _newInterest,
        uint256 _newDeadline
    ) external loanExists(_loanId) onlyBorrower(_loanId) {
        Loan storage loan = loans[_loanId];
        
        if (loan.status != LoanStatus.Requested) {
            revert InvalidLoanStatus();
        }
        
        if (_newLoanAmount == 0) revert InvalidLoanAmount();
        if (_newDeadline <= block.timestamp) revert InvalidDeadline();
        
        loan.loanAmount = _newLoanAmount;
        loan.interest = _newInterest;
        loan.deadline = _newDeadline;
        
        emit LoanEdited(_loanId, _newLoanAmount, _newInterest, _newDeadline);
    }
    
    /**
     * @dev Fund a loan request
     * @param _loanId The ID of the loan to fund
     */
    function fundLoan(uint256 _loanId) external payable loanExists(_loanId) {
        Loan storage loan = loans[_loanId];
        
        if (loan.status != LoanStatus.Requested) {
            revert LoanAlreadyFunded();
        }
        if (msg.sender == loan.borrower) {
            revert SelfFundingNotAllowed();
        }
        if (block.timestamp > loan.deadline) {
            revert DeadlineExpired();
        }
        if (msg.value != loan.loanAmount) {
            revert IncorrectFundingAmount();
        }
        
        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        
        // Transfer funds to borrower
        (bool success, ) = loan.borrower.call{value: msg.value}("");
        require(success, "Transfer to borrower failed");
        
        emit LoanFunded(_loanId, msg.sender, msg.value);
    }
    
    /**
     * @dev Repay a funded loan
     * @param _loanId The ID of the loan to repay
     */
    function repayLoan(uint256 _loanId) external payable loanExists(_loanId) onlyBorrower(_loanId) {
        Loan storage loan = loans[_loanId];
        
        if (loan.status != LoanStatus.Funded) {
            revert InvalidLoanStatus();
        }
        if (block.timestamp > loan.deadline) {
            revert DeadlineExpired();
        }
        
        uint256 expectedDebt = loan.loanAmount + loan.interest;
        
        if (msg.value != expectedDebt) {
            revert IncorrectRepaymentAmount();
        }
        
        loan.status = LoanStatus.Repaid;
        
        // Transfer repayment to lender
        (bool success, ) = loan.lender.call{value: msg.value}("");
        require(success, "Transfer to lender failed");
        
        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }
    
    /**
     * @dev Mark loan as defaulted
     * @param _loanId The ID of the loan
     */
    function markAsDefaulted(uint256 _loanId) external loanExists(_loanId) {
        Loan storage loan = loans[_loanId];
        
        if (msg.sender != loan.lender) {
            revert UnauthorizedAccess();
        }
        
        if (loan.status != LoanStatus.Funded) {
            revert InvalidLoanStatus();
        }
        if (block.timestamp <= loan.deadline) {
            revert DeadlineExpired();
        }
        
        loan.status = LoanStatus.Defaulted;
        
        emit LoanDefaulted(_loanId);
    }
    
    /**
     * @dev Get loan details
     * @param _loanId The ID of the loan
     * @return Loan struct with all details
     */
    function getLoan(uint256 _loanId) external view loanExists(_loanId) returns (Loan memory) {
        return loans[_loanId];
    }
    
    /**
     * @dev Calculate total debt for a loan
     * @param _loanId The ID of the loan
     * @return Total debt amount
     */
    function calculateDebt(uint256 _loanId) external view loanExists(_loanId) returns (uint256) {
        Loan memory loan = loans[_loanId];
        return loan.loanAmount + loan.interest;
    }
    
    /**
     * @dev Check if a loan is active and within deadline
     * @param _loanId The ID of the loan
     * @return bool indicating if loan is active
     */
    function isLoanActive(uint256 _loanId) external view loanExists(_loanId) returns (bool) {
        Loan memory loan = loans[_loanId];
        return loan.status == LoanStatus.Funded && block.timestamp <= loan.deadline;
    }
}
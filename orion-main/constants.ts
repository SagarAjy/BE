const Admin = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 2,
    menu: 'Management',
    subMenu: [
      {
        label: 'Audit Logs',
        path: 'audit_logs',
      },
      {
        label: 'User Management',
        path: 'user_management',
      },
      {
        label: 'Sanctionwise Targets',
        path: 'sanctionwise_targets',
      },
      {
        label: 'Branchwise Targets',
        path: 'branchwise_targets',
      },
    ],
  },
  {
    id: 3,
    menu: 'Service',
    subMenu: [
      {
        label: 'Active Services',
        path: 'active_services',
      },
      {
        label: 'Tickets',
        path: 'support_tickets',
      },
    ],
  },
  {
    id: 4,
    menu: 'Leads',
    subMenu: [
      { label: 'Create Lead', path: 'create_lead' },
      { label: 'All Leads', path: 'all_leads' },
      { label: 'Fresh Leads', path: 'fresh_leads' },
      { label: 'Callback Leads', path: 'callback_leads' },
      { label: 'Interested', path: 'interested' },
      { label: 'Not Interested', path: 'not_interested' },
      { label: 'Not Eligible', path: 'not_eligible' },
      { label: 'No Answer', path: 'no_answer' },
      { label: 'Incomplete Docs', path: 'incomplete_docs' },
      { label: 'Docs Recieved', path: 'docs_recieved' },
    ],
  },
  {
    id: 5,
    menu: 'KYC',
    subMenu: [
      { label: 'KYC Requests', path: 'video_kyc' },
      { label: 'E-Sign Docs', path: 'esign_docs' },
    ],
  },
  {
    id: 6,
    menu: 'Credit',
    subMenu: [
      {
        label: 'Approved',
        path: 'approved',
      },
      {
        label: 'Rejected',
        path: 'rejected',
      },
    ],
  },
  {
    id: 7,
    menu: 'Disbursal',
    subMenu: [
      {
        label: 'Bank Update',
        path: 'bank_update',
      },
      {
        label: 'Disbursed',
        path: 'disbursed',
      },
    ],
  },
  {
    id: 8,
    menu: 'Collection',
    subMenu: [
      {
        label: 'All Collections',
        path: 'all_collections',
      },
      {
        label: 'Waiver Requests',
        path: 'waiver_requests',
      },
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
  {
    id: 9,
    menu: 'Reports',
    subMenu: [
      {
        label: 'Disbursed Data',
        path: 'disbursed_data',
      },
      {
        label: 'Collection Data',
        path: 'collection_data',
      },
      {
        label: 'CIBIL Data',
        path: 'cibil_data',
      },
    ],
  },
];

const Tele_Caller = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 2,
    menu: 'Leads',
    subMenu: [
      { label: 'Create Lead', path: 'create_lead' },
      { label: 'All Leads', path: 'all_leads' },
      { label: 'Fresh Leads', path: 'fresh_leads' },
      { label: 'Callback Leads', path: 'callback_leads' },
      { label: 'Interested', path: 'interested' },
      { label: 'Not Interested', path: 'not_interested' },
      { label: 'Not Eligible', path: 'not_eligible' },
      { label: 'No Answer', path: 'no_answer' },
      { label: 'Incomplete Docs', path: 'incomplete_docs' },
      { label: 'Docs Recieved', path: 'docs_recieved' },
    ],
  },
  {
    id: 3,
    menu: 'Collection',
    subMenu: [
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
];

const Credit_Manager = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 2,
    menu: 'Leads',
    subMenu: [
      { label: 'Create Lead', path: 'create_lead' },
      { label: 'All Leads', path: 'all_leads' },
      { label: 'Callback Leads', path: 'callback_leads' },
      { label: 'Interested', path: 'interested' },
      { label: 'Not Interested', path: 'not_interested' },
      { label: 'Not Eligible', path: 'not_eligible' },
      { label: 'No Answer', path: 'no_answer' },
      { label: 'Incomplete Docs', path: 'incomplete_docs' },
      { label: 'Docs Recieved', path: 'docs_recieved' },
    ],
  },
  {
    id: 3,
    menu: 'Credit',
    subMenu: [
      {
        label: 'Approved',
        path: 'approved',
      },
      {
        label: 'Rejected',
        path: 'rejected',
      },
    ],
  },
  {
    id: 6,
    menu: 'Disbursal',
    subMenu: [
      {
        label: 'Bank Update',
        path: 'bank_update',
      },
      {
        label: 'Disbursed',
        path: 'disbursed',
      },
    ],
  },
  {
    id: 4,
    menu: 'Collection',
    subMenu: [
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
  {
    id: 5,
    menu: 'Reports',
    subMenu: [
      {
        label: 'Disbursed Data',
        path: 'disbursed_data',
      },
      {
        label: 'Collection Data',
        path: 'collection_data',
      },
      {
        label: 'CIBIL Data',
        path: 'cibil_data',
      },
    ],
  },
];

const Collection_Manager = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 3,
    menu: 'Collection',
    subMenu: [
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
];

const Accounts = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 2,
    menu: 'Disbursal',
    subMenu: [
      {
        label: 'Bank Update',
        path: 'bank_update',
      },
      {
        label: 'Disbursed',
        path: 'disbursed',
      },
    ],
  },
  {
    id: 3,
    menu: 'Collection',
    subMenu: [
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
  {
    id: 4,
    menu: 'Reports',
    subMenu: [
      {
        label: 'Disbursed Data',
        path: 'disbursed_data',
      },
      {
        label: 'Collection Data',
        path: 'collection_data',
      },
    ],
  },
];

const Service = [
  {
    id: 1,
    menu: 'Overview',
  },
  {
    id: 2,
    menu: 'Service',
    subMenu: [
      {
        label: 'Tickets',
        path: 'support_tickets',
      },
    ],
  },
  {
    id: 3,
    menu: 'Leads',
    subMenu: [
      { label: 'Create Lead', path: 'create_lead' },
      { label: 'All Leads', path: 'all_leads' },
    ],
  },
  {
    id: 4,
    menu: 'Collection',
    subMenu: [
      {
        label: 'Payday Pending',
        path: 'payday_pending',
      },
      {
        label: 'Part Payment',
        path: 'part_payment',
      },
      {
        label: 'Closed',
        path: 'closed',
      },
      {
        label: 'Settlement',
        path: 'settlement',
      },
    ],
  },
  {
    id: 5,
    menu: 'Reports',
    subMenu: [
      {
        label: 'Disbursed Data',
        path: 'disbursed_data',
      },
      {
        label: 'Collection Data',
        path: 'collection_data',
      },
      {
        label: 'CIBIL Data',
        path: 'cibil_data',
      },
    ],
  },
];

export const tabsByRole = {
  Admin,
  Tele_Caller,
  Credit_Manager,
  Collection_Manager,
  Accounts,
  Service,
};

export const emptyUUID = '00000000-0000-0000-0000-000000000000';

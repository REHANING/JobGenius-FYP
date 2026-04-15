// API service for fetching internships and job data from JSearch API
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string | undefined;
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: string;
  recruiterId: string;
  status: 'active' | 'inactive' | 'draft';
  applicants?: any[];
  url?: string;
  remote?: boolean;
  experience?: string;
  industry?: string;
  // JSearch API specific fields
  applyLink?: string;
  employerLogo?: string;
  jobPublisher?: string;
  jobCountry?: string;
  jobCity?: string;
  jobState?: string;
  // Personalized recommendations fields
  similarity_score?: number;
  matchReason?: string;
  match_reason?: string;
}

export interface InternshipsApiResponse {
  success: boolean;
  data?: JobData[];
  error?: string;
  message?: string;
}

// Fetch internships from JSearch API via backend proxy
export const fetchJSearchInternships = async (page: number = 1, limit: number = 10): Promise<InternshipsApiResponse> => {
  try {
    // Use our backend proxy to avoid CORS issues
    const url = `http://localhost:5000/api/jobs/internships?page=${page}&limit=${limit}`;
    
    console.log('🔗 Fetching JSearch internships from backend proxy:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ JSearch API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 JSearch Backend Response:', responseData);
    
    // Our backend already transforms the data, so we can use it directly
    const transformedJobs: JobData[] = responseData.data || [];

    return {
      success: true,
      data: transformedJobs,
      message: `Found ${transformedJobs.length} JSearch internship opportunities`
    };

  } catch (error) {
    console.error('❌ Error fetching JSearch internships:', error);
    
    // Check if it's a CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🚫 CORS Error detected - API might not allow browser requests');
      return {
        success: false,
        error: 'CORS Error: API does not allow browser requests. Please check the API documentation.',
        data: []
      };
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('network')) {
      console.error('🌐 Network Error detected');
      return {
        success: false,
        error: 'Network Error: Please check your internet connection.',
        data: []
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch JSearch internships',
      data: []
    };
  }
};

// Fetch internships from our backend proxy (fallback method)
export const fetchInternships = async (page: number = 1, limit: number = 10): Promise<InternshipsApiResponse> => {
  try {
    // Use our backend proxy to avoid CORS issues
    const url = `http://localhost:5000/api/jobs/latest?page=${page}&limit=${limit}`;
    
    console.log('🔗 Fetching from backend proxy:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Backend Response:', responseData);
    
    // Our backend already transforms the data, so we can use it directly
    const transformedJobs: JobData[] = responseData.data || [];

    return {
      success: true,
      data: transformedJobs,
      message: `Found ${transformedJobs.length} job opportunities`
    };

  } catch (error) {
    console.error('❌ Error fetching internships:', error);
    
    // Check if it's a CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🚫 CORS Error detected - API might not allow browser requests');
      return {
        success: false,
        error: 'CORS Error: API does not allow browser requests. Please check the API documentation.',
        data: []
      };
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('network')) {
      console.error('🌐 Network Error detected');
      return {
        success: false,
        error: 'Network Error: Please check your internet connection.',
        data: []
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch internships',
      data: []
    };
  }
};

// Fetch jobs by location
export const fetchInternshipsByLocation = async (location: string): Promise<InternshipsApiResponse> => {
  try {
    if (!RAPIDAPI_KEY) {
      return {
        success: false,
        error: 'RapidAPI key is not configured. Set VITE_RAPIDAPI_KEY to enable location-based search.',
        data: [],
      };
    }

    // You might need to adjust this endpoint based on the API documentation
    const response = await fetch(`https://internships-api.p.rapidapi.com/active-jb-7d?location=${encodeURIComponent(location)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': JSEARCH_API_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the API response
    const transformedJobs: JobData[] = data.map((job: any, index: number) => ({
      id: job.id || `internship-${index}`,
      title: job.title || job.position || 'Internship Position',
      company: job.company || job.company_name || 'Company Name',
      location: job.location || job.city || location,
      type: job.type || job.job_type || 'internship',
      salary: job.salary || job.compensation || 'Competitive',
      description: job.description || job.summary || 'Join our team for an exciting internship opportunity.',
      requirements: job.requirements || job.qualifications || [],
      skills: job.skills || job.technologies || [],
      postedDate: job.posted_date || job.created_at || new Date().toISOString().split('T')[0],
      recruiterId: job.recruiter_id || 'unknown',
      status: 'active',
      url: job.url || job.apply_url,
      remote: job.remote || false,
      experience: job.experience_level || 'Entry Level',
      industry: job.industry || 'Technology'
    }));

    return {
      success: true,
      data: transformedJobs,
      message: `Found ${transformedJobs.length} internship opportunities in ${location}`
    };

  } catch (error) {
    console.error('Error fetching internships by location:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch internships',
      data: []
    };
  }
};

// Fetch single job by ID using our backend proxy
export const fetchSingleJob = async (id: string): Promise<InternshipsApiResponse> => {
  try {
    const url = `http://localhost:5000/api/jobs/job/${id}`;
    
    console.log('🔗 Fetching single job from backend proxy:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Single Job Backend Response:', responseData);
    
    // Our backend already transforms the data
    const transformedJob = responseData.data;

    return {
      success: true,
      data: [transformedJob],
      message: 'Job details fetched successfully'
    };

  } catch (error) {
    console.error('Error fetching single job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch job details',
      data: []
    };
  }
};

// Search internships by keyword using backend search endpoint
export const searchInternships = async (keyword: string): Promise<InternshipsApiResponse> => {
  try {
    const url = `http://localhost:5000/api/jobs/search?q=${encodeURIComponent(keyword)}`;
    
    console.log('🔍 Searching jobs via backend:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Search API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Search Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || [],
      message: responseData.message || `Found opportunities for "${keyword}"`
    };

  } catch (error) {
    console.error('Error searching internships:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search internships',
      data: []
    };
  }
};

// Fetch remote jobs
export const fetchRemoteJobs = async (page: number = 1, limit: number = 10): Promise<InternshipsApiResponse> => {
  try {
    const url = `http://localhost:5000/api/jobs/remote?page=${page}&limit=${limit}`;
    
    console.log('🔗 Fetching remote jobs from backend:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Remote Jobs API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Remote Jobs Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || [],
      message: responseData.message || `Found remote job opportunities`
    };

  } catch (error) {
    console.error('Error fetching remote jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch remote jobs',
      data: []
    };
  }
};

// Fetch jobs by type
export const fetchJobsByType = async (jobType: string, page: number = 1, limit: number = 10): Promise<InternshipsApiResponse> => {
  try {
    const url = `http://localhost:5000/api/jobs/type/${encodeURIComponent(jobType)}?page=${page}&limit=${limit}`;
    
    console.log('🔗 Fetching jobs by type from backend:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Jobs by Type API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Jobs by Type Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || [],
      message: responseData.message || `Found ${jobType} opportunities`
    };

  } catch (error) {
    console.error('Error fetching jobs by type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch jobs by type',
      data: []
    };
  }
};

// Dashboard Scores API
export interface UserScores {
  id: number;
  user_id: string;
  overall_score: number;
  education_score: number;
  future_readiness_score: number;
  skills_readiness_score: number;
  geographic_score: number;
  profile_views: number;
  applications_count: number;
  interviews_count: number;
  offers_count: number;
  top_countries: string[];
  geographical_value?: string;
  analysis_summary?: string;
  ilo_level?: number;
  ilo_label?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoresApiResponse {
  success: boolean;
  data?: UserScores;
  message?: string;
  error?: string;
}

// Fetch user scores and dashboard stats
export const fetchUserScores = async (userId: string): Promise<ScoresApiResponse> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}`;
    
    console.log('🔗 Fetching user scores from backend:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Scores API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Scores Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data,
      message: responseData.message || 'Scores fetched successfully'
    };

  } catch (error) {
    console.error('Error fetching user scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user scores',
    };
  }
};

// Update user scores
export const updateUserScores = async (userId: string, scores: Partial<UserScores>): Promise<ScoresApiResponse> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}`;
    
    console.log('🔗 Updating user scores via backend:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scores),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update Scores API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Update Scores Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data,
      message: responseData.message || 'Scores updated successfully'
    };

  } catch (error) {
    console.error('Error updating user scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user scores',
    };
  }
};

// Increment specific counter (profile views, applications, etc.)
export const incrementUserCounter = async (userId: string, field: string): Promise<ScoresApiResponse> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/increment`;
    
    console.log('🔗 Incrementing user counter via backend:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Increment Counter API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Increment Counter Backend Response:', responseData);
    
    return {
      success: true,
      data: responseData.data,
      message: responseData.message || 'Counter incremented successfully'
    };

  } catch (error) {
    console.error('Error incrementing user counter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment counter',
    };
  }
};

// Analyze resume and generate scores using AI
export const analyzeResume = async (userId: string): Promise<ScoresApiResponse> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/analyze`;
    
    console.log('🔗 Analyzing resume via backend:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    console.log('📦 Analyze Resume Backend Response:', responseData);
    
    if (!response.ok || !responseData.success) {
      return {
        success: false,
        error: responseData.error || 'Failed to analyze resume',
        requiresSubscription: responseData.requiresSubscription || false,
        requiresUpgrade: responseData.requiresUpgrade || false,
        analysisLimit: responseData.analysisLimit,
        currentCount: responseData.currentCount
      };
    }
    
    return {
      success: true,
      data: responseData.data,
      message: responseData.message || 'Resume analyzed successfully',
      analysisCount: responseData.analysisCount
    };

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze resume',
    };
  }
};

// RAG API Interfaces
export interface JobRecommendation {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience_level: string;
  remote: boolean;
  country: string;
  visa_sponsorship: boolean;
  similarity_score: number;
  match_reason: string;
}

export interface CourseRecommendation {
  id: number;
  title: string;
  provider: string;
  duration: string;
  level: string;
  price: string;
  description: string;
  skills_taught: string[];
  category: string;
  rating: number;
  students: number;
  similarity_score: number;
  relevance_reason: string;
}

export interface VisaInformation {
  country: string;
  visa_info: {
    work_visa: string;
    requirements: string[];
    process_steps: string[];
    processing_time: string;
    validity: string;
    cost: string;
  };
}

export interface DashboardRecommendations {
  success: boolean;
  message: string;
  data: {
    jobs: JobRecommendation[];
    courses: CourseRecommendation[];
    visa_info: VisaInformation[];
    user_profile?: {
      skills: string[];
      experience_level: string;
      ilo_level: number;
      future_readiness: number;
    };
    skill_gaps?: string[];
    improvement_areas?: string[];
  };
  metadata: {
    jobs_count: number;
    courses_count: number;
    countries_count: number;
  };
}

// RAG API Functions
export const getJobRecommendations = async (userId: string): Promise<{success: boolean; data?: JobRecommendation[]; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/rag/jobs/${userId}`;
    
    console.log('🔗 Getting job recommendations from RAG service:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Job Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Job Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || []
    };

  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job recommendations',
    };
  }
};

export const getCourseRecommendations = async (userId: string): Promise<{success: boolean; data?: CourseRecommendation[]; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/rag/courses/${userId}`;
    
    console.log('🔗 Getting course recommendations from RAG service:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Course Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Course Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || []
    };

  } catch (error) {
    console.error('Error getting course recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get course recommendations',
    };
  }
};

export const getVisaInformation = async (userId: string): Promise<{success: boolean; data?: VisaInformation[]; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/rag/visa/${userId}`;
    
    console.log('🔗 Getting visa information from RAG service:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Visa Information API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Visa Information Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || []
    };

  } catch (error) {
    console.error('Error getting visa information:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get visa information',
    };
  }
};

export const getDashboardRecommendations = async (userId: string): Promise<DashboardRecommendations> => {
  try {
    const url = `http://localhost:5000/api/rag/dashboard/${userId}`;
    
    console.log('🔗 Getting comprehensive dashboard recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Dashboard Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Dashboard Recommendations Response:', responseData);
    
    return responseData;

  } catch (error) {
    console.error('Error getting dashboard recommendations:', error);
    return {
      success: false,
      message: 'Failed to get dashboard recommendations',
      data: {
        jobs: [],
        courses: [],
        visa_info: []
      },
      metadata: {
        jobs_count: 0,
        courses_count: 0,
        countries_count: 0
      }
    };
  }
};

// Education Recommendations Interface
export interface EducationRecommendation {
  recommendedDegree: {
    level: string;
    field: string;
    reason: string;
  };
  topUniversities: Array<{
    name: string;
    country: string;
    rank?: string;
    reason: string;
    program?: string;
  }>;
  topCountries: Array<{
    country: string;
    reason: string;
    advantages: string[];
  }>;
  careerAlignment: string;
  nextSteps: string[];
}

export const getEducationRecommendations = async (userId: string): Promise<{success: boolean; data?: EducationRecommendation; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/education-recommendations`;
    
    console.log('🎓 Getting education recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Education Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Education Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting education recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get education recommendations',
    };
  }
};

// Future Readiness Recommendations Interface
export interface FutureReadinessRecommendation {
  careerPaths: {
    shortTerm: {
      roles: string[];
      description: string;
      timeline: string;
    };
    midTerm: {
      roles: string[];
      description: string;
      timeline: string;
    };
    longTerm: {
      roles: string[];
      description: string;
      timeline: string;
    };
  };
  emergingSkills: Array<{
    skill: string;
    importance: string;
    relevance: string;
    priority: string;
  }>;
  industryTrends: Array<{
    industry: string;
    trend: string;
    opportunity: string;
    growth: string;
  }>;
  technologyTrends: Array<{
    technology: string;
    impact: string;
    action: string;
  }>;
  marketOpportunities: Array<{
    opportunity: string;
    whyNow: string;
    howToPrepare: string;
  }>;
  careerAdvice: string;
  actionPlan: string[];
}

export const getFutureReadinessRecommendations = async (userId: string): Promise<{success: boolean; data?: FutureReadinessRecommendation; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/future-readiness-recommendations`;
    
    console.log('🚀 Getting future readiness recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Future Readiness Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Future Readiness Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting future readiness recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get future readiness recommendations',
    };
  }
};

// Skills Readiness Recommendations Interface
export interface SkillsReadinessRecommendation {
  currentSkillsAnalysis: Array<{
    skill: string;
    demand: string;
    marketValue: string;
    trend: string;
    relevance: string;
  }>;
  skillsGap: Array<{
    skill: string;
    importance: string;
    reason: string;
    impact: string;
  }>;
  inDemandSkills: Array<{
    skill: string;
    demandLevel: string;
    industryRelevance: string;
    salaryImpact: string;
    jobAvailability: string;
  }>;
  recommendedSkills: Array<{
    skill: string;
    priority: string;
    reason: string;
    learningPath: string;
    timeToLearn: string;
    complements: string[];
  }>;
  complementarySkills: Array<{
    skill: string;
    complements: string[];
    synergy: string;
    value: string;
  }>;
  emergingSkills: Array<{
    skill: string;
    trend: string;
    futureValue: string;
    adoptionRate: string;
  }>;
  obsoleteSkills: Array<{
    skill: string;
    status: string;
    replacement: string;
    transition: string;
  }>;
  skillsReadinessScore: {
    overall: string;
    marketAlignment: string;
    completeness: string;
    futureProofing: string;
    summary: string;
  };
  actionPlan: string[];
}

export const getSkillsReadinessRecommendations = async (userId: string): Promise<{success: boolean; data?: SkillsReadinessRecommendation; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/skills-readiness-recommendations`;
    
    console.log('💼 Getting skills readiness recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Skills Readiness Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Skills Readiness Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting skills readiness recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get skills readiness recommendations',
    };
  }
};

// Geographic Recommendations Interface
export interface GeographicCountry {
  country: string;
  reason: string;
  jobMarket: string;
  salaryPotential: string;
  immigrationEase: string;
  priority: string;
}

export interface VisaType {
  type: string;
  description: string;
  eligibility: string[];
  requirements: string[];
  processSteps: string[];
  processingTime: string;
  cost: string;
  validity: string;
  links: string[];
  notes: string;
}

export interface VisaInformation {
  country: string;
  visaTypes: VisaType[];
  generalInfo: {
    overview: string;
    bestFor: string;
    tips: string[];
    commonMistakes: string[];
    additionalResources: string[];
  };
  enhancedInfo: {
    marketConditions: string;
    recentUpdates: string;
    bestPractices: string[];
  };
}

export const getGeographicRecommendations = async (userId: string): Promise<{success: boolean; data?: GeographicCountry[]; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/geographic-recommendations`;
    
    console.log('🌍 Getting geographic recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Geographic Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Geographic Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data || []
    };

  } catch (error) {
    console.error('Error getting geographic recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get geographic recommendations',
    };
  }
};

export const getVisaInfoForCountry = async (userId: string, country: string): Promise<{success: boolean; data?: VisaInformation; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/visa-info/${encodeURIComponent(country)}`;
    
    console.log('🛂 Getting visa information for country:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Visa Information API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Visa Information Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting visa information:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get visa information',
    };
  }
};

// Personalized Job Recommendations Interface
export interface PersonalizedJobRecommendations {
  jobs: JobData[];
  analysis: string;
  searchQueries: string[];
  jobTitles: string[];
  keySkills: string[];
  experienceLevel: string;
  industries: string[];
}

export const getPersonalizedJobRecommendations = async (userId: string): Promise<{success: boolean; data?: PersonalizedJobRecommendations; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/job-recommendations`;
    
    console.log('💼 Getting personalized job recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Personalized Job Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Personalized Job Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting personalized job recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get personalized job recommendations',
    };
  }
};

// Personalized Course Recommendations Interface
export interface PersonalizedCourseRecommendations {
  courses: Array<{
    id: string;
    title: string;
    provider: string;
    duration: string;
    level: string;
    price: string;
    description: string;
    skills_taught: string[];
    category: string;
    rating: number;
    students: number;
    instructor: string;
    enrollmentLink: string;
    matchReason: string;
    similarityScore: number;
    certificate: string;
    language: string;
    format: string;
  }>;
  analysis: string;
  skillGaps: string[];
  careerImpact: string;
}

export const getPersonalizedCourseRecommendations = async (userId: string): Promise<{success: boolean; data?: PersonalizedCourseRecommendations; error?: string}> => {
  try {
    const url = `http://localhost:5000/api/scores/${userId}/course-recommendations`;
    
    console.log('📚 Getting personalized course recommendations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Personalized Course Recommendations API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📦 Personalized Course Recommendations Response:', responseData);
    
    return {
      success: true,
      data: responseData.data
    };

  } catch (error) {
    console.error('Error getting personalized course recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get personalized course recommendations',
    };
  }
};

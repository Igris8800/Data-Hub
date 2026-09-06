import becomeAnalyst from "./posts/how-to-become-a-data-analyst";
import sqlInterview from "./posts/sql-interview-questions";
import pandasGroupby from "./posts/pandas-groupby-guide";
import vlookupXlookup from "./posts/vlookup-vs-xlookup";
import pvalues from "./posts/p-values-and-ab-testing-explained";

// Add new posts here — newest first is handled automatically by the date sort below.
const POSTS = [becomeAnalyst, sqlInterview, pandasGroupby, vlookupXlookup, pvalues];

export const ALL_POSTS = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
export const getPost = (slug) => ALL_POSTS.find((p) => p.slug === slug);

# Model py
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import pickle
import logging
from typing import List, Dict, Any
import warnings
import random
warnings.filterwarnings('ignore')

class TravelRecommendationModel:
    def __init__(self):
        self.df = None
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.content_similarity_matrix = None
        self.processed_features = None
        self.feature_columns = []
        
    def load_data(self, file_path: str):
        """Load and preprocess the travel package dataset"""
        try:
            if file_path.endswith('.xlsx'):
                self.df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                self.df = pd.read_csv(file_path)
            else:
                raise ValueError("Unsupported file format. Please use .xlsx or .csv files.")
            
            logging.info(f"Loaded dataset with {len(self.df)} records")
            return True
        except Exception as e:
            logging.error(f"Error loading data: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess the dataset for recommendation"""
        if self.df is None:
            raise ValueError("Dataset not loaded. Please load data first.")
        
        # Create a copy for processing
        df_processed = self.df.copy()
        
        # Handle missing values
        df_processed = df_processed.fillna('')
        
        # Convert categorical columns to lowercase for consistency
        categorical_columns = ['Tourist country', 'Month', 'Price USD', 'Location', 'Interest', 'Activities', 'Overnight_stay']
        for col in categorical_columns:
            if col in df_processed.columns:
                df_processed[col] = df_processed[col].astype(str).str.lower().str.strip()
        
        # Create combined text features for content-based filtering
        text_features = []
        for _, row in df_processed.iterrows():
            combined_text = f"{row.get('Location', '')} {row.get('Interest', '')} {row.get('Activities', '')} {row.get('Overnight_stay', '')}"
            text_features.append(combined_text)
        
        # Create TF-IDF matrix for content similarity
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(text_features)
        self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
        
        # Encode categorical features
        categorical_cols = ['Tourist country', 'Month', 'Price USD', 'Location', 'Overnight_stay']
        for col in categorical_cols:
            if col in df_processed.columns:
                le = LabelEncoder()
                df_processed[f'{col}_encoded'] = le.fit_transform(df_processed[col])
                self.label_encoders[col] = le
                self.feature_columns.append(f'{col}_encoded')
        
        # Add duration as numeric feature
        if 'Duration' in df_processed.columns:
            df_processed['Duration_numeric'] = pd.to_numeric(df_processed['Duration'], errors='coerce').fillna(7)
            self.feature_columns.append('Duration_numeric')
        
        # Create interest matching scores
        df_processed['interest_score'] = 0
        self.feature_columns.append('interest_score')
        
        # Scale numerical features
        if self.feature_columns:
            self.processed_features = self.scaler.fit_transform(df_processed[self.feature_columns])
        
        self.df_processed = df_processed
        logging.info("Data preprocessing completed successfully")
    
    def calculate_interest_match_score(self, user_interests: List[str], package_interests: str) -> float:
        """Calculate how well package interests match user interests"""
        if not package_interests:
            return 0.0
        
        package_interests = package_interests.lower()
        user_interests = [interest.lower() for interest in user_interests]
        
        matches = 0
        for interest in user_interests:
            if interest in package_interests:
                matches += 1
        
        return matches / len(user_interests) if user_interests else 0.0
    
    def calculate_budget_score(self, user_budget: str, package_budget: str) -> float:
        """Calculate budget compatibility score"""
        budget_mapping = {'low': 1, 'medium': 2, 'high': 3}
        user_budget_num = budget_mapping.get(user_budget.lower(), 2)
        package_budget_num = budget_mapping.get(package_budget.lower(), 2)
        
        # Perfect match gets score 1.0, adjacent budgets get 0.7, distant get 0.3
        if user_budget_num == package_budget_num:
            return 1.0
        elif abs(user_budget_num - package_budget_num) == 1:
            return 0.7
        else:
            return 0.3
    
    def get_recommendations(self, user_preferences: Dict[str, Any], top_k: int = 10) -> List[Dict]:
        """Generate travel package recommendations based on user preferences"""
        if self.df_processed is None:
            raise ValueError("Model not trained. Please preprocess data first.")
        
        recommendations = []
        
        # Extract user preferences
        user_country = user_preferences.get('country', '').lower().strip()
        user_duration = int(user_preferences.get('duration', 7))
        user_month = user_preferences.get('month', '').lower().strip()
        user_budget = user_preferences.get('budget_level', 'medium').lower().strip()
        user_interests = [interest.lower().strip() for interest in user_preferences.get('interests', [])]
        user_overnight = user_preferences.get('overnight_stay', '').lower().strip()  # New parameter
        
        # Calculate scores for each package
        for idx, row in self.df_processed.iterrows():
            score = 0.0
            
            # Country match (25% weight - reduced to accommodate overnight stay)
            if row['Tourist country'] == user_country:
                score += 0.25
            
            # Duration match (20% weight)
            duration_diff = abs(row.get('Duration_numeric', 7) - user_duration)
            duration_score = max(0, 1 - duration_diff / 10)  # Normalize duration difference
            score += 0.2 * duration_score
            
            # Month match (15% weight)
            if row['Month'] == user_month:
                score += 0.15
            
            # Budget compatibility (15% weight)
            budget_score = self.calculate_budget_score(user_budget, row['Price USD'])
            score += 0.15 * budget_score
            
            # Interest match (15% weight - reduced)
            interest_score = self.calculate_interest_match_score(user_interests, row.get('Interest', ''))
            score += 0.15 * interest_score
            
            # Overnight stay preference match (10% weight - NEW)
            overnight_score = 0.0
            if user_overnight and row.get('Overnight_stay', ''):
                if user_overnight in row['Overnight_stay'] or row['Overnight_stay'] in user_overnight:
                    overnight_score = 1.0
                elif len(user_overnight) > 0:  # Partial match bonus
                    overnight_score = 0.3
            elif not user_overnight:  # No preference specified, neutral score
                overnight_score = 0.5
            score += 0.1 * overnight_score
            
            # Content similarity bonus (using cosine similarity from TF-IDF)
            if idx < len(self.content_similarity_matrix):
                # Find packages with similar content
                content_scores = self.content_similarity_matrix[idx]
                avg_content_score = np.mean(content_scores)
                score += 0.1 * avg_content_score
            
            # Create recommendation entry
            recommendation = {
                'index': idx,
                'score': score,
                'country': row['Tourist country'],
                'month': row['Month'],
                'duration': row.get('Duration_numeric', 7),
                'budget': row['Price USD'],
                'location': row.get('Location', ''),
                'interests': row.get('Interest', ''),
                'activities': row.get('Activities', ''),
                'overnight_stay': row.get('Overnight_stay', ''),
                'duration_score': duration_score,
                'budget_score': budget_score,
                'interest_score': interest_score,
                'overnight_score': overnight_score
            }
            
            recommendations.append(recommendation)
        
        # Sort by score and return top K
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:top_k]
    
    def get_diverse_recommendations(self, user_preferences: Dict[str, Any], top_k: int = 10) -> List[Dict]:
        """Get diverse recommendations to avoid similar packages"""
        initial_recommendations = self.get_recommendations(user_preferences, top_k * 2)
        
        diverse_recommendations = []
        seen_locations = set()
        
        for rec in initial_recommendations:
            location = rec['location']
            # Add some diversity by avoiding too many packages from same location
            if location not in seen_locations or len(diverse_recommendations) < top_k // 2:
                diverse_recommendations.append(rec)
                seen_locations.add(location)
                
                if len(diverse_recommendations) >= top_k:
                    break
        
        return diverse_recommendations
    
    def save_model(self, filepath: str):
        """Save the trained model"""
        model_data = {
            'tfidf_vectorizer': self.tfidf_vectorizer,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'content_similarity_matrix': self.content_similarity_matrix,
            'processed_features': self.processed_features,
            'feature_columns': self.feature_columns,
            'df_processed': self.df_processed
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        logging.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load a trained model"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.tfidf_vectorizer = model_data['tfidf_vectorizer']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.content_similarity_matrix = model_data['content_similarity_matrix']
            self.processed_features = model_data['processed_features']
            self.feature_columns = model_data['feature_columns']
            self.df_processed = model_data['df_processed']
            
            logging.info(f"Model loaded from {filepath}")
            return True
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            return False
    
    def explain_recommendation(self, recommendation: Dict) -> str:
        """Provide explanation for why a package was recommended"""
        explanation = []
        
        if recommendation['score'] > 0.8:
            explanation.append("Excellent match for your preferences!")
        elif recommendation['score'] > 0.6:
            explanation.append("Very good match for your preferences.")
        elif recommendation['score'] > 0.4:
            explanation.append("Good match with some of your preferences.")
        else:
            explanation.append("Partial match with your preferences.")
        
        if recommendation['duration_score'] > 0.8:
            explanation.append(f"Duration ({recommendation['duration']} days) closely matches your preference.")
        
        if recommendation['budget_score'] > 0.7:
            explanation.append("Budget level aligns well with your preference.")
        
        if recommendation['interest_score'] > 0.5:
            explanation.append("Activities match several of your interests.")
        
        return " ".join(explanation)

    # ACCURACY EVALUATION METHODS START HERE
    
    def create_test_users(self, n_users=50):
        """Create synthetic test users from dataset"""
        if self.df_processed is None:
            raise ValueError("Model not loaded")
        
        df = self.df_processed
        test_users = []
        
        # Get unique values
        countries = df['Tourist country'].unique()
        months = df['Month'].unique()
        budgets = df['Price USD'].unique()
        durations = df['Duration_numeric'].unique()
        stays = df['Overnight_stay'].unique()
        
        # Get interests
        interests = []
        for interest_str in df['Interest'].dropna():
            if isinstance(interest_str, str):
                interests.extend([i.strip().lower() for i in interest_str.split(',')])
        interests = list(set(interests))
        
        random.seed(42)  # For reproducible results
        
        for i in range(n_users):
            user = {
                'country': random.choice(countries),
                'duration': int(random.choice(durations)),
                'month': random.choice(months),
                'budget_level': random.choice(budgets),
                'interests': random.sample(interests, random.randint(1, 3)),
                'overnight_stay': random.choice(stays)
            }
            test_users.append(user)
        
        return test_users
    
    def calculate_precision_at_k(self, recommendations, user_prefs, k=5):
        """Calculate how many of top-k recommendations are relevant"""
        if not recommendations:
            return 0.0
        
        top_k = recommendations[:k]
        relevant = 0
        
        for rec in top_k:
            score = 0
            
            # Country match (most important)
            if rec['country'].lower() == user_prefs['country'].lower():
                score += 0.4
            
            # Duration match (within 2 days)
            if abs(rec['duration'] - user_prefs['duration']) <= 2:
                score += 0.2
            
            # Month match
            if rec['month'].lower() == user_prefs['month'].lower():
                score += 0.2
            
            # Budget match
            if rec['budget'].lower() == user_prefs['budget_level'].lower():
                score += 0.1
            
            # Interest match
            user_interests = [i.lower() for i in user_prefs['interests']]
            rec_interests = rec['interests'].lower()
            matches = sum(1 for interest in user_interests if interest in rec_interests)
            if matches > 0:
                score += 0.1 * (matches / len(user_interests))
            
            if score >= 0.5:  # Consider relevant if score >= 0.5
                relevant += 1
        
        return relevant / k
    
    def evaluate_accuracy(self, n_test_users=50, k=10, print_results=True):
        """Main evaluation function"""
        if print_results:
            print(f"Creating {n_test_users} test users...")
        
        test_users = self.create_test_users(n_test_users)
        
        precision_scores = []
        score_stats = []
        successful_tests = 0
        
        if print_results:
            print("Running accuracy evaluation...")
        
        for i, user in enumerate(test_users):
            try:
                recommendations = self.get_recommendations(user, k)
                
                if recommendations:
                    # Calculate precision
                    precision = self.calculate_precision_at_k(recommendations, user, k)
                    precision_scores.append(precision)
                    
                    # Collect recommendation scores
                    rec_scores = [rec['score'] for rec in recommendations]
                    score_stats.extend(rec_scores)
                    
                    successful_tests += 1
                
                # Progress indicator
                if print_results and (i + 1) % 10 == 0:
                    print(f"Completed {i + 1}/{n_test_users} tests")
                    
            except Exception as e:
                if print_results:
                    print(f"Error testing user {i}: {e}")
                continue
        
        # Calculate overall metrics
        if precision_scores:
            avg_precision = np.mean(precision_scores)
            precision_std = np.std(precision_scores)
            
            if print_results:
                print("\n" + "="*50)
                print("RECOMMENDATION ACCURACY RESULTS")
                print("="*50)
                print(f"Total test users: {n_test_users}")
                print(f"Successful evaluations: {successful_tests}")
                print(f"Success rate: {successful_tests/n_test_users*100:.1f}%")
                print()
                print(f"PRECISION@{k}:")
                print(f"  Average: {avg_precision:.3f}")
                print(f"  Std Dev: {precision_std:.3f}")
                print(f"  Min: {min(precision_scores):.3f}")
                print(f"  Max: {max(precision_scores):.3f}")
                print()
                
                # Score distribution
                if score_stats:
                    print("RECOMMENDATION SCORES:")
                    print(f"  Average score: {np.mean(score_stats):.3f}")
                    print(f"  Score std dev: {np.std(score_stats):.3f}")
                    print(f"  Score range: {min(score_stats):.3f} - {max(score_stats):.3f}")
                    print()
                
                # Quality assessment
                print("QUALITY ASSESSMENT:")
                if avg_precision >= 0.7:
                    print("  EXCELLENT - High precision")
                elif avg_precision >= 0.5:
                    print("  GOOD - Acceptable precision")
                elif avg_precision >= 0.3:
                    print("  FAIR - Moderate precision")
                else:
                    print("  POOR - Low precision")
                
                print("="*50)
            
            return {
                'precision': avg_precision,
                'precision_std': precision_std,
                'successful_tests': successful_tests,
                'total_tests': n_test_users,
                'success_rate': successful_tests/n_test_users,
                'avg_score': np.mean(score_stats) if score_stats else 0,
                'score_std': np.std(score_stats) if score_stats else 0,
                'min_score': min(score_stats) if score_stats else 0,
                'max_score': max(score_stats) if score_stats else 0,
                'quality_rating': 'EXCELLENT' if avg_precision >= 0.7 else 
                                'GOOD' if avg_precision >= 0.5 else 
                                'FAIR' if avg_precision >= 0.3 else 'POOR'
            }
        else:
            if print_results:
                print("No successful evaluations completed!")
            return None
    
    def quick_accuracy_check(self):
        """Quick accuracy check with default parameters"""
        return self.evaluate_accuracy(n_test_users=30, k=5, print_results=True)

# Example usage and testing
if __name__ == "__main__":
    # Initialize the model
    model = TravelRecommendationModel()
    
    # Load and preprocess data (replace with your XLSX path)
    if model.load_data("SRI_LANKA_TOUR_DATASET.xlsx"):
        model.preprocess_data()
        
        # Example user preferences
        user_prefs = {
            "country": "sri lanka",
            "duration": 7,
            "month": "june",
            "budget_level": "medium",
            "interests": ["cultural", "adventure", "wildlife", "historical"]
        }
        
        # Get recommendations
        recommendations = model.get_diverse_recommendations(user_prefs, top_k=5)
        
        print("Top 5 Recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. Location: {rec['location']}")
            print(f"   Score: {rec['score']:.2f}")
            print(f"   Duration: {rec['duration']} days")
            print(f"   Budget: {rec['budget']}")
            print(f"   Activities: {rec['activities'][:100]}...")
            print(f"   Explanation: {model.explain_recommendation(rec)}")
        
        # NEW: Run accuracy evaluation
        print("\n" + "="*60)
        print("RUNNING ACCURACY EVALUATION")
        print("="*60)
        accuracy_results = model.evaluate_accuracy(n_test_users=100, k=10)
        
        # Save the model
        model.save_model("travel_recommendation_model.pkl")